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
import java.io.File

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.nbsn_mobile/fingerprint"
    private val ACTION_USB_PERMISSION = "com.example.nbsn_mobile.USB_PERMISSION"
    private var pendingResult: MethodChannel.Result? = null
    private var usbManager: UsbManager? = null
    private var usbHostCtx: UsbDeviceDataExchangeImpl? = null
    private var syncDir: File? = null
    private var captureThread: CaptureThread? = null
    
    companion object {
        private const val TAG = "FingerprintService"
        const val MESSAGE_SHOW_MSG = 1
        const val MESSAGE_SHOW_ERROR_MSG = 2
        const val MESSAGE_END_OPERATION = 3
        const val MESSAGE_CAPTURE_SUCCESS = 4
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
                Log.d(TAG, "USB device permission granted")
                if (usbHostCtx?.ValidateContext() == true) {
                    startCaptureOperation()
                } else {
                    pendingResult?.error("USB_ERROR", "Can't open scanner device", null)
                    pendingResult = null
                }
                true
            }
            UsbDeviceDataExchangeImpl.MESSAGE_DENY_DEVICE -> {
                Log.d(TAG, "USB device permission denied")
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
                            if (it.vendorId == 0x1491) {
                                Log.d(TAG, "Futronic scanner attached: ${it.deviceName}")
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
                            if (it.vendorId == 0x1491) {
                                Log.d(TAG, "Futronic scanner detached: ${it.deviceName}")
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in USB receiver", e)
            }
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
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun captureFingerprint(result: MethodChannel.Result) {
        Log.d(TAG, "captureFingerprint called")
        try {
            pendingResult = result
            
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
                    val deviceList = usbManager?.deviceList
                    if (deviceList?.values?.any { it.vendorId == 0x1491 } == true) {
                        pendingResult?.error("USB_ERROR", "Scanner detected but failed to open. Try disconnecting and reconnecting the scanner.", null)
                    } else {
                        pendingResult?.error("NO_DEVICE", "No Futronic scanner found. Please connect the scanner via USB.", null)
                    }
                    pendingResult = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in captureFingerprint", e)
            pendingResult?.error("ERROR", "Error: ${e.message}", null)
            pendingResult = null
        }
    }

    private fun startCaptureOperation() {
        Log.d(TAG, "Starting capture operation")
        captureThread = CaptureThread()
        captureThread?.start()
    }

    private inner class CaptureThread : Thread() {
        private var cancelled = false
        
        fun cancel() {
            cancelled = true
        }
        
        override fun run() {
            Log.d(TAG, "Capture thread started")
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

    private fun verifyFingerprint(storedTemplate: String, result: MethodChannel.Result) {
        Log.d(TAG, "verifyFingerprint called")
        try {
            pendingResult = result
            val templateBytes = android.util.Base64.decode(storedTemplate, android.util.Base64.DEFAULT)
            
            // Just try to open the device - UsbDeviceDataExchangeImpl will handle permission
            if (usbHostCtx?.OpenDevice(0, true) == true) {
                startVerifyOperation(templateBytes)
            } else {
                if (usbHostCtx?.IsPendingOpen() == true) {
                    Log.d(TAG, "Waiting for USB permission dialog...")
                } else {
                    val deviceList = usbManager?.deviceList
                    if (deviceList?.values?.any { it.vendorId == 0x1491 } == true) {
                        pendingResult?.error("USB_ERROR", "Scanner detected but failed to open", null)
                    } else {
                        pendingResult?.error("NO_DEVICE", "No Futronic scanner found", null)
                    }
                    pendingResult = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in verifyFingerprint", e)
            result.error("ERROR", "Error: ${e.message}", null)
        }
    }

    private fun startVerifyOperation(template: ByteArray) {
        val verifyThread = VerifyThread(template)
        verifyThread.start()
    }

    private inner class VerifyThread(private val storedTemplate: ByteArray) : Thread() {
        private var cancelled = false
        
        override fun run() {
            Log.d(TAG, "Verify thread started")
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
                if (device.vendorId == 0x1491) {
                    Log.d(TAG, "Futronic scanner found!")
                    return true
                }
            }
            
            Log.d(TAG, "No Futronic scanner found")
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
            usbHostCtx?.CloseDevice()
            usbHostCtx?.Destroy()
            unregisterReceiver(usbReceiver)
        } catch (e: Exception) {
            Log.e(TAG, "Error in cleanup", e)
        }
    }
}
