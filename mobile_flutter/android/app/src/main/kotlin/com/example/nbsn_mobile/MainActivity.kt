package com.example.nbsn_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.content.Context
import android.content.BroadcastReceiver
import android.content.IntentFilter
import android.content.Intent
import android.hardware.usb.UsbManager
import android.hardware.usb.UsbDevice
import android.app.PendingIntent
import android.util.Log
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.os.SystemClock
import com.futronictech.AnsiSDKLib
import com.futronictech.UsbDeviceDataExchangeImpl
import com.zkteco.android.biometric.core.device.ParameterHelper
import com.zkteco.android.biometric.core.device.TransportType
import com.zkteco.android.biometric.module.fingerprint.FingerprintCaptureListener
import com.zkteco.android.biometric.module.fingerprint.FingerprintExceptionListener
import com.zkteco.android.biometric.module.fingerprint.FingerprintFactory
import com.zkteco.android.biometric.module.fingerprint.FingerprintSensor
import com.zkteco.android.biometric.module.fingerprint.exception.FingerprintSensorException
import com.zkteco.android.biometric.module.fingerprintreader.ZKFingerService
import java.io.File
import java.util.HashMap

sealed class ScannerType {
    object Futronic : ScannerType()
    object ZKFinger : ScannerType()
    object None : ScannerType()
}

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.nbsn_mobile/fingerprint"
    private val ACTION_USB_PERMISSION = "com.example.nbsn_mobile.USB_PERMISSION"
    private var pendingResult: MethodChannel.Result? = null
    private var usbManager: UsbManager? = null
    private var usbHostCtx: UsbDeviceDataExchangeImpl? = null
    private var syncDir: File? = null
    private var captureThread: CaptureThread? = null
    private var zkCaptureThread: ZKFingerCaptureThread? = null
    
    // ZKFinger specific variables
    private var zkusbManager: ZKUSBManager? = null
    private var fingerprintSensor: FingerprintSensor? = null
    private var zkVid = 0x1b55
    private var zkPid = 0x0121
    private var bStarted = false
    private var currentScannerType: ScannerType = ScannerType.None
    
    companion object {
        private const val TAG = "FingerprintService"
        const val MESSAGE_SHOW_MSG = 1
        const val MESSAGE_SHOW_ERROR_MSG = 2
        const val MESSAGE_END_OPERATION = 3
        const val MESSAGE_CAPTURE_SUCCESS = 4
        const val FUTRONIC_VID = 0x1491
        const val ZKTECO_VID = 0x1b55
    }

    private val mHandler = Handler(Looper.getMainLooper()) { msg ->
        when (msg.what) {
            MESSAGE_SHOW_MSG -> {
                val message = msg.obj as String
                Log.d(TAG, message)
                true
            }
            MESSAGE_SHOW_ERROR_MSG -> {
                val error = msg.obj as String
                Log.e(TAG, error)
                pendingResult?.error("CAPTURE_ERROR", error, null)
                pendingResult = null
                true
            }
            MESSAGE_CAPTURE_SUCCESS -> {
                val template = msg.obj as String
                pendingResult?.success(template)
                pendingResult = null
                true
            }
            MESSAGE_END_OPERATION -> {
                Log.d(TAG, "Operation ended")
                true
            }
            UsbDeviceDataExchangeImpl.MESSAGE_ALLOW_DEVICE -> {
                Log.d(TAG, "USB device permission granted (Futronic)")
                if (usbHostCtx?.ValidateContext() == true) {
                    startCaptureOperation()
                } else {
                    pendingResult?.error("USB_ERROR", "Can't open scanner device", null)
                    pendingResult = null
                }
                true
            }
            UsbDeviceDataExchangeImpl.MESSAGE_DENY_DEVICE -> {
                Log.d(TAG, "USB device permission denied (Futronic)")
                pendingResult?.error("PERMISSION_DENIED", "User denied scanner device", null)
                pendingResult = null
                true
            }
            else -> false
        }
    }

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            try {
                when (intent.action) {
                    ACTION_USB_PERMISSION -> {
                        synchronized(this) {
                            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                            } else {
                                @Suppress("DEPRECATION")
                                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                            }

                            if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                                device?.let {
                                    Log.d(TAG, "USB permission granted for device: ${it.deviceName}")
                                    if (pendingResult != null) {
                                        startCaptureOperation()
                                    }
                                }
                            } else {
                                Log.d(TAG, "USB permission denied")
                                pendingResult?.error("PERMISSION_DENIED", "USB permission denied", null)
                                pendingResult = null
                            }
                        }
                    }
                    UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                        val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                        } else {
                            @Suppress("DEPRECATION")
                            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                        }
                        
                        device?.let {
                            when (it.vendorId) {
                                FUTRONIC_VID -> Log.d(TAG, "Futronic scanner attached: ${it.deviceName}")
                                ZKTECO_VID -> Log.d(TAG, "ZKFinger scanner attached: ${it.deviceName}")
                            }
                        }
                    }
                    UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                        val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                        } else {
                            @Suppress("DEPRECATION")
                            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                        }
                        
                        device?.let {
                            when (it.vendorId) {
                                FUTRONIC_VID -> Log.d(TAG, "Futronic scanner detached: ${it.deviceName}")
                                ZKTECO_VID -> Log.d(TAG, "ZKFinger scanner detached: ${it.deviceName}")
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in USB receiver", e)
            }
        }
    }

    private val zkusbManagerListener = object : ZKUSBManagerListener {
        override fun onCheckPermission(result: Int) {
            afterGetUsbPermission(result)
        }

        override fun onUSBArrived(device: UsbDevice?) {
            if (bStarted) {
                closeZKDevice()
                tryGetZKUsbPermission()
            }
        }

        override fun onUSBRemoved(device: UsbDevice?) {
            Log.d(TAG, "ZKFinger USB device removed")
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        try {
            usbManager = getSystemService(Context.USB_SERVICE) as UsbManager
            usbHostCtx = UsbDeviceDataExchangeImpl(this, mHandler)
            syncDir = this.getExternalFilesDir(null)
            
            val filter = IntentFilter().apply {
                addAction(ACTION_USB_PERMISSION)
                addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
                addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(usbReceiver, filter)
            }
            
            // Initialize ZKFinger USB manager
            zkusbManager = ZKUSBManager(this.applicationContext, zkusbManagerListener)
            zkusbManager?.registerUSBPermissionReceiver()
            
            Log.d(TAG, "USB receiver registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing USB", e)
        }
        
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "captureFingerprint" -> {
                    captureFingerprint(result)
                }
                "verifyFingerprint" -> {
                    val template = call.argument<String>("template")
                    if (template != null) {
                        verifyFingerprint(template, result)
                    } else {
                        result.error("INVALID_ARGUMENT", "Template is required", null)
                    }
                }
                "isScannerAvailable" -> {
                    result.success(isScannerAvailable())
                }
                "getScannerType" -> {
                    // Returns "futronic", "zkteco", or "none"
                    result.success(when (detectScannerType()) {
                        ScannerType.Futronic -> "futronic"
                        ScannerType.ZKFinger -> "zkteco"
                        ScannerType.None -> "none"
                    })
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun detectScannerType(): ScannerType {
        try {
            val deviceList = usbManager?.deviceList
            deviceList?.values?.forEach { device ->
                when (device.vendorId) {
                    FUTRONIC_VID -> return ScannerType.Futronic
                    ZKTECO_VID -> {
                        zkPid = device.productId
                        return ScannerType.ZKFinger
                    }
                }
            }
            return ScannerType.None
        } catch (e: Exception) {
            Log.e(TAG, "Error detecting scanner type", e)
            return ScannerType.None
        }
    }

    private fun captureFingerprint(result: MethodChannel.Result) {
        Log.d(TAG, "captureFingerprint called")
        try {
            pendingResult = result
            currentScannerType = detectScannerType()
            
            when (currentScannerType) {
                ScannerType.Futronic -> captureFutronic()
                ScannerType.ZKFinger -> captureZKFinger()
                ScannerType.None -> {
                    pendingResult?.error("NO_DEVICE", "No supported scanner found. Please connect either Futronic or ZKFinger scanner.", null)
                    pendingResult = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in captureFingerprint", e)
            pendingResult?.error("ERROR", "Error: ${e.message}", null)
            pendingResult = null
        }
    }

    private fun captureFutronic() {
        Log.d(TAG, "Starting Futronic capture")
        // Just try to open the device - UsbDeviceDataExchangeImpl will handle permission
        if (usbHostCtx?.OpenDevice(0, true) == true) {
            // Device opened successfully, start capture
            startCaptureOperation()
        } else {
            // Check if permission is pending
            if (usbHostCtx?.IsPendingOpen() == true) {
                Log.d(TAG, "Waiting for USB permission dialog...")
                // Permission dialog will be shown, wait for MESSAGE_ALLOW_DEVICE or MESSAGE_DENY_DEVICE
            } else {
                // Failed to open device
                pendingResult?.error("USB_ERROR", "Futronic scanner detected but failed to open. Try disconnecting and reconnecting the scanner.", null)
                pendingResult = null
            }
        }
    }

    private fun captureZKFinger() {
        Log.d(TAG, "Starting ZKFinger capture")
        if (!enumZKDevice()) {
            pendingResult?.error("NO_DEVICE", "ZKFinger scanner not found. Please connect the scanner.", null)
            pendingResult = null
            return
        }
        tryGetZKUsbPermission()
    }

    private fun enumZKDevice(): Boolean {
        val usbManager = getSystemService(Context.USB_SERVICE) as UsbManager
        for (device in usbManager.deviceList.values) {
            val device_vid = device.vendorId
            val device_pid = device.productId
            if (device_vid == ZKTECO_VID) {
                zkPid = device_pid
                return true
            }
        }
        return false
    }

    private fun tryGetZKUsbPermission() {
        zkusbManager?.initUSBPermission(ZKTECO_VID, zkPid)
    }

    private fun afterGetUsbPermission(result: Int) {
        when (result) {
            0 -> openZKDevice()
            -1 -> {
                pendingResult?.error("NO_DEVICE", "ZKFinger device not found", null)
                pendingResult = null
            }
            -2 -> {
                pendingResult?.error("PERMISSION_DENIED", "ZKFinger device permission denied", null)
                pendingResult = null
            }
        }
    }

    private fun openZKDevice() {
        zkCaptureThread = ZKFingerCaptureThread()
        zkCaptureThread?.start()
    }

    private fun startCaptureOperation() {
        Log.d(TAG, "Starting capture operation (Futronic)")
        captureThread = CaptureThread()
        captureThread?.start()
    }

    private inner class CaptureThread : Thread() {
        private var cancelled = false
        
        fun cancel() {
            cancelled = true
        }
        
        override fun run() {
            Log.d(TAG, "Capture thread started (Futronic)")
            val ansiLib = AnsiSDKLib()
            var devOpen = false
            
            try {
                val syncDirPath = syncDir?.absolutePath ?: ""
                if (!ansiLib.SetGlobalSyncDir(syncDirPath)) {
                    val error = ansiLib.GetErrorMessage()
                    Log.e(TAG, "SetGlobalSyncDir failed: $error")
                    mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, error).sendToTarget()
                    mHandler.obtainMessage(MESSAGE_END_OPERATION).sendToTarget()
                    return
                }
                
                if (!ansiLib.OpenDeviceCtx(usbHostCtx)) {
                    val error = ansiLib.GetErrorMessage()
                    Log.e(TAG, "OpenDeviceCtx failed: $error")
                    mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, error).sendToTarget()
                    mHandler.obtainMessage(MESSAGE_END_OPERATION).sendToTarget()
                    return
                }
                
                devOpen = true
                Log.d(TAG, "Device opened successfully")
                
                if (!ansiLib.FillImageSize()) {
                    val error = ansiLib.GetErrorMessage()
                    Log.e(TAG, "FillImageSize failed: $error")
                    mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, error).sendToTarget()
                    mHandler.obtainMessage(MESSAGE_END_OPERATION).sendToTarget()
                    return
                }
                
                val imgBuffer = ByteArray(ansiLib.GetImageSize())
                val tmplSize = ansiLib.GetMaxTemplateSize()
                val template = ByteArray(tmplSize)
                val realSize = IntArray(1)
                
                Log.d(TAG, "Waiting for finger...")
                while (!cancelled) {
                    // Try to create template (capture + create in one operation)
                    if (ansiLib.CreateTemplate(0, imgBuffer, template, realSize)) {
                        Log.d(TAG, "Fingerprint captured successfully!")
                        // Convert template to Base64 without wrapping newlines
                        val templateBytes = template.copyOf(realSize[0])
                        val templateString = android.util.Base64.encodeToString(templateBytes, android.util.Base64.NO_WRAP)
                        
                        mHandler.obtainMessage(MESSAGE_CAPTURE_SUCCESS, templateString).sendToTarget()
                        break
                    } else {
                        val lastError = ansiLib.GetErrorCode()
                        
                        if (lastError == AnsiSDKLib.FTR_ERROR_EMPTY_FRAME ||
                            lastError == AnsiSDKLib.FTR_ERROR_NO_FRAME ||
                            lastError == AnsiSDKLib.FTR_ERROR_MOVABLE_FINGER) {
                            sleep(100)
                            continue
                        } else {
                            val error = "Capture failed. Error: ${ansiLib.GetErrorMessage()}"
                            Log.e(TAG, error)
                            mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, error).sendToTarget()
                            break
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in capture thread", e)
                mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, e.message ?: "Capture thread error").sendToTarget()
            } finally {
                if (devOpen) {
                    ansiLib.CloseDevice()
                    Log.d(TAG, "Device closed")
                }
                mHandler.obtainMessage(MESSAGE_END_OPERATION).sendToTarget()
            }
        }
    }

    private inner class ZKFingerCaptureThread : Thread() {
        private var cancelled = false
        private var registerTemplate: ByteArray? = null
        private var isRegistering = false
        
        fun cancel() {
            cancelled = true
        }
        
        override fun run() {
            Log.d(TAG, "ZKFinger Capture thread started")
            var devOpen = false
            
            try {
                createFingerprintSensor()
                bStarted = false
                
                if (0 != ZKFingerService.init()) {
                    mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, "ZKFinger service init failed").sendToTarget()
                    return
                }
                
                fingerprintSensor?.open(0)
                devOpen = true
                bStarted = true
                
                val captureListener = object : FingerprintCaptureListener {
                    override fun captureOK(mode: Int, rawImage: ByteArray, attributes: IntArray, fpTemplate: ByteArray) {
                        try {
                            val templateLength = fingerprintSensor?.lastTempLen ?: 0
                            Log.d(TAG, "ZKFinger capture OK. Template length: $templateLength")
                            
                            val templateBytes = fpTemplate.copyOf(templateLength)
                            val templateString = android.util.Base64.encodeToString(templateBytes, android.util.Base64.NO_WRAP)
                            
                            mHandler.obtainMessage(MESSAGE_CAPTURE_SUCCESS, templateString).sendToTarget()
                            cancel()
                        } catch (e: Exception) {
                            Log.e(TAG, "Error in captureOK", e)
                            mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, "Capture error: ${e.message}").sendToTarget()
                        }
                    }

                    override fun captureError(exception: FingerprintSensorException?) {
                        Log.e(TAG, "ZKFinger capture error", exception)
                        mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, "Capture error: ${exception?.message}").sendToTarget()
                    }
                }
                
                val exceptionListener = FingerprintExceptionListener {
                    Log.e(TAG, "ZKFinger exception occurred")
                }
                
                fingerprintSensor?.setFingerprintCaptureListener(0, captureListener)
                fingerprintSensor?.startCapture(0)
                Log.d(TAG, "ZKFinger waiting for finger...")
                
                while (!cancelled) {
                    sleep(100)
                }
                
            } catch (e: FingerprintSensorException) {
                Log.e(TAG, "ZKFinger sensor exception", e)
                mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, "Sensor error: ${e.message}").sendToTarget()
                try {
                    fingerprintSensor?.rebootDeviceEx(0)
                } catch (ex: Exception) {
                    Log.e(TAG, "Error rebooting ZKFinger device", ex)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in ZKFinger capture thread", e)
                mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, "ZKFinger capture error: ${e.message}").sendToTarget()
            } finally {
                closeZKDevice()
                mHandler.obtainMessage(MESSAGE_END_OPERATION).sendToTarget()
            }
        }
        
        private fun createFingerprintSensor() {
            if (null != fingerprintSensor) {
                FingerprintFactory.destroy(fingerprintSensor)
                fingerprintSensor = null
            }
            val deviceParams = HashMap<String, Any>()
            deviceParams[ParameterHelper.PARAM_KEY_VID] = ZKTECO_VID
            deviceParams[ParameterHelper.PARAM_KEY_PID] = zkPid
            fingerprintSensor = FingerprintFactory.createFingerprintSensor(this@MainActivity, TransportType.USB, deviceParams)
        }
    }

    private fun closeZKDevice() {
        if (bStarted) {
            try {
                fingerprintSensor?.stopCapture(0)
                fingerprintSensor?.close(0)
            } catch (e: Exception) {
                Log.e(TAG, "Error closing ZKFinger device", e)
            }
            ZKFingerService.free()
            bStarted = false
        }
    }

    private fun verifyFingerprint(storedTemplate: String, result: MethodChannel.Result) {
        Log.d(TAG, "verifyFingerprint called")
        try {
            pendingResult = result
            currentScannerType = detectScannerType()
            
            when (currentScannerType) {
                ScannerType.Futronic -> verifyFutronic(storedTemplate)
                ScannerType.ZKFinger -> verifyZKFinger(storedTemplate)
                ScannerType.None -> {
                    pendingResult?.error("NO_DEVICE", "No supported scanner found.", null)
                    pendingResult = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in verifyFingerprint", e)
            result.error("ERROR", "Error: ${e.message}", null)
        }
    }

    private fun verifyFutronic(storedTemplate: String) {
        Log.d(TAG, "Starting Futronic verification")
        try {
            val templateBytes = android.util.Base64.decode(storedTemplate, android.util.Base64.DEFAULT)
            
            // Just try to open the device - UsbDeviceDataExchangeImpl will handle permission
            if (usbHostCtx?.OpenDevice(0, true) == true) {
                startVerifyOperation(templateBytes)
            } else {
                if (usbHostCtx?.IsPendingOpen() == true) {
                    Log.d(TAG, "Waiting for USB permission dialog...")
                } else {
                    pendingResult?.error("USB_ERROR", "Futronic scanner detected but failed to open", null)
                    pendingResult = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in verifyFutronic", e)
            pendingResult?.error("ERROR", "Error: ${e.message}", null)
            pendingResult = null
        }
    }

    private fun verifyZKFinger(storedTemplate: String) {
        Log.d(TAG, "ZKFinger verification not implemented yet")
        pendingResult?.error("NOT_IMPLEMENTED", "ZKFinger verification not available yet", null)
        pendingResult = null
    }

    private fun startVerifyOperation(template: ByteArray) {
        val verifyThread = VerifyThread(template)
        verifyThread.start()
    }

    private inner class VerifyThread(private val storedTemplate: ByteArray) : Thread() {
        private var cancelled = false
        
        override fun run() {
            Log.d(TAG, "Verify thread started (Futronic)")
            val ansiLib = AnsiSDKLib()
            var devOpen = false
            
            try {
                val syncDirPath = syncDir?.absolutePath ?: ""
                ansiLib.SetGlobalSyncDir(syncDirPath)
                
                if (!ansiLib.OpenDeviceCtx(usbHostCtx)) {
                    mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, ansiLib.GetErrorMessage()).sendToTarget()
                    return
                }
                
                devOpen = true
                ansiLib.FillImageSize()
                
                val imgBuffer = ByteArray(ansiLib.GetImageSize())
                val matchResult = FloatArray(1)
                
                Log.d(TAG, "Waiting for finger for verification...")
                while (!cancelled) {
                    if (ansiLib.VerifyTemplate(0, storedTemplate, imgBuffer, matchResult)) {
                        Log.d(TAG, "Verification completed. Score: ${matchResult[0]}")
                        val success = matchResult[0] > 0 // Match score > 0 usually means success
                        mHandler.post {
                            pendingResult?.success(success)
                            pendingResult = null
                        }
                        break
                    } else {
                        val lastError = ansiLib.GetErrorCode()
                        if (lastError == AnsiSDKLib.FTR_ERROR_EMPTY_FRAME ||
                            lastError == AnsiSDKLib.FTR_ERROR_NO_FRAME ||
                            lastError == AnsiSDKLib.FTR_ERROR_MOVABLE_FINGER) {
                            sleep(100)
                            continue
                        } else {
                            val error = "Verification failed: ${ansiLib.GetErrorMessage()}"
                            mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, error).sendToTarget()
                            break
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in verify thread", e)
                mHandler.obtainMessage(MESSAGE_SHOW_ERROR_MSG, e.message ?: "Verify thread error").sendToTarget()
            } finally {
                if (devOpen) ansiLib.CloseDevice()
                mHandler.obtainMessage(MESSAGE_END_OPERATION).sendToTarget()
            }
        }
    }

    private fun isScannerAvailable(): Boolean {
        try {
            val deviceList = usbManager?.deviceList
            Log.d(TAG, "Checking scanner availability. Device count: ${deviceList?.size ?: 0}")
            
            deviceList?.values?.forEach { device ->
                Log.d(TAG, "Found USB device: vendorId=${device.vendorId}, productId=${device.productId}, deviceName=${device.deviceName}")
                if (device.vendorId == FUTRONIC_VID || device.vendorId == ZKTECO_VID) {
                    Log.d(TAG, "Supported scanner found!")
                    return true
                }
            }
            
            Log.d(TAG, "No supported scanner found")
            return false
        } catch (e: Exception) {
            Log.e(TAG, "Error checking scanner availability", e)
            return false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            captureThread?.cancel()
            zkCaptureThread?.cancel()
            usbHostCtx?.CloseDevice()
            closeZKDevice()
            unregisterReceiver(usbReceiver)
            zkusbManager?.unRegisterUSBPermissionReceiver()
        } catch (e: Exception) {
            Log.e(TAG, "Error in cleanup", e)
        }
    }

    /**
     * Called when a USB device is attached AND this activity is already running
     * (because launchMode="singleTop" prevents a second instance).
     * We absorb the intent so the scanner is silently claimed by our app.
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleUsbAttachIntent(intent)
    }

    /**
     * Called when this activity starts fresh from a USB_DEVICE_ATTACHED broadcast
     * (i.e. the app was not running when the scanner was plugged in).
     */
    override fun onResume() {
        super.onResume()
        handleUsbAttachIntent(intent)
    }

    /**
     * Silently handle USB_DEVICE_ATTACHED — just log it.
     * The actual permission request happens via ZKUSBManager when the user
     * triggers a scan. This prevents RLMS or any other app from grabbing focus.
     */
    private fun handleUsbAttachIntent(intent: Intent?) {
        if (intent?.action == UsbManager.ACTION_USB_DEVICE_ATTACHED) {
            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }
            if (device != null) {
                Log.d(TAG, "USB device attached via intent: vid=${device.vendorId} pid=${device.productId} — handled by NBSN Mobile")
                // Update detected scanner type so the Flutter UI reflects the connection
                when (device.vendorId) {
                    ZKTECO_VID -> {
                        zkPid = device.productId
                        Log.d(TAG, "ZKTeco scanner registered (vid=${device.vendorId} pid=${device.productId})")
                    }
                    FUTRONIC_VID -> Log.d(TAG, "Futronic scanner registered")
                }
            }
            // Consume the intent so it is not processed again on next onResume
            setIntent(Intent())
        }
    }
}

// ─── ZKTeco USB helper ────────────────────────────────────────────────────────

interface ZKUSBManagerListener {
    /** Called after permission check. result: 0 = granted, -1 = no device, -2 = denied */
    fun onCheckPermission(result: Int)
    fun onUSBArrived(device: UsbDevice?)
    fun onUSBRemoved(device: UsbDevice?)
}

class ZKUSBManager(
    private val context: Context,
    private val listener: ZKUSBManagerListener
) {
    companion object {
        private const val TAG = "ZKUSBManager"
        private const val ACTION_ZK_USB_PERMISSION = "com.example.nbsn_mobile.ZK_USB_PERMISSION"
    }

    private val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var targetVid = 0
    private var targetPid = 0

    private val permissionReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            when (intent.action) {
                ACTION_ZK_USB_PERMISSION -> {
                    val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                    }
                    val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                    Log.d(TAG, "USB permission result: granted=$granted, device=$device")
                    listener.onCheckPermission(if (granted) 0 else -2)
                }
            }
        }
    }

    private val usbStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }
            when (intent.action) {
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                    if (device?.vendorId == targetVid) listener.onUSBArrived(device)
                }
                UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                    if (device?.vendorId == targetVid) listener.onUSBRemoved(device)
                }
            }
        }
    }

    fun registerUSBPermissionReceiver() {
        val permFilter = IntentFilter(ACTION_ZK_USB_PERMISSION)
        val stateFilter = IntentFilter().apply {
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(permissionReceiver, permFilter, Context.RECEIVER_NOT_EXPORTED)
            context.registerReceiver(usbStateReceiver, stateFilter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(permissionReceiver, permFilter)
            context.registerReceiver(usbStateReceiver, stateFilter)
        }
        Log.d(TAG, "USB receivers registered")
    }

    fun unRegisterUSBPermissionReceiver() {
        try {
            context.unregisterReceiver(permissionReceiver)
            context.unregisterReceiver(usbStateReceiver)
        } catch (e: Exception) {
            Log.w(TAG, "Error unregistering receivers: ${e.message}")
        }
    }

    fun initUSBPermission(vid: Int, pid: Int) {
        targetVid = vid
        targetPid = pid
        val device = findDevice(vid, pid)
        if (device == null) {
            Log.w(TAG, "ZK device not found (vid=$vid, pid=$pid)")
            listener.onCheckPermission(-1)
            return
        }
        if (usbManager.hasPermission(device)) {
            Log.d(TAG, "Already have permission for ZK device")
            listener.onCheckPermission(0)
            return
        }
        // On API 31+ the Intent must be explicit (set package) to use with getBroadcast.
        // On API 34+ FLAG_MUTABLE + implicit intent is disallowed — use FLAG_IMMUTABLE.
        // For USB permission, FLAG_IMMUTABLE is safe: the USB manager fills in the extras.
        val permissionIntent = Intent(ACTION_ZK_USB_PERMISSION).apply {
            setPackage(context.packageName)
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        else
            PendingIntent.FLAG_UPDATE_CURRENT
        val permIntent = PendingIntent.getBroadcast(context, 0, permissionIntent, flags)
        usbManager.requestPermission(device, permIntent)
        Log.d(TAG, "Requesting USB permission for ZK device")
    }

    private fun findDevice(vid: Int, pid: Int): UsbDevice? =
        usbManager.deviceList.values.firstOrNull {
            it.vendorId == vid && (pid == 0 || it.productId == pid)
        } ?: usbManager.deviceList.values.firstOrNull { it.vendorId == vid }
}
