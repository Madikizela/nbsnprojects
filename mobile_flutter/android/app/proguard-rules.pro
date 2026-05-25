# Futronic SDK
-keep class com.futronictech.** { *; }
-dontwarn com.futronictech.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Play Core (optional, can be ignored)
-dontwarn com.google.android.play.core.**
