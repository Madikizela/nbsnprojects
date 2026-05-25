# 📱 Android Emulator Setup Guide

Running the mobile app on an Android emulator bypasses all network/firewall issues!

## Option 1: Quick Setup with Android Studio (Recommended)

### Step 1: Download Android Studio

1. Go to: https://developer.android.com/studio
2. Click **"Download Android Studio"**
3. Accept terms and download (about 1GB)
4. Run the installer

### Step 2: Install Android Studio

1. Run the downloaded `.exe` file
2. Click **"Next"** through the setup wizard
3. Choose **"Standard"** installation
4. Click **"Finish"**
5. Wait for components to download (this takes 10-15 minutes)

### Step 3: Create Virtual Device

1. Open **Android Studio**
2. Click **"More Actions"** → **"Virtual Device Manager"**
3. Click **"Create Device"**
4. Select **"Pixel 5"** (or any phone)
5. Click **"Next"**
6. Select **"Tiramisu"** (API 33) or latest version
7. Click **"Download"** next to the system image
8. Wait for download to complete
9. Click **"Next"** → **"Finish"**

### Step 4: Start Emulator

1. In Virtual Device Manager, click **▶ Play** button
2. Wait for emulator to boot (takes 1-2 minutes first time)
3. You'll see an Android phone on your screen

### Step 5: Update API Configuration

The emulator uses `10.0.2.2` to access your 