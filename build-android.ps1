# F:\cinewave\build-android.ps1
# سكربت بناء تطبيق Android بشكل احترافي ومضمون

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CineWave - Android Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 1. التحقق من Java 17 وتثبيته تلقائياً
# ============================================================
Write-Host "[1/6] التحقق من Java 17..." -ForegroundColor Yellow

# البحث عن Java 17
$javaPath = $null
$javaPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Amazon Corretto\jdk17*",
    "C:\Program Files\Microsoft\jdk-17*"
)

foreach ($pathPattern in $javaPaths) {
    $found = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $javaPath = $found.FullName
        break
    }
}

if (-not $javaPath) {
    Write-Host "⚠️  Java 17 غير مثبت. جاري التثبيت..." -ForegroundColor Yellow
    
    # تنزيل Java 17 من Adoptium
    $javaUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi"
    $javaInstaller = "$env:TEMP\OpenJDK17.msi"
    
    Write-Host "   تنزيل Java 17..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $javaUrl -OutFile $javaInstaller -UseBasicParsing
    
    Write-Host "   تثبيت Java 17..." -ForegroundColor Gray
    Start-Process -FilePath "msiexec" -ArgumentList "/i `"$javaInstaller`" /quiet /norestart" -Wait
    
    # البحث مرة أخرى عن المسار
    $found = Get-ChildItem -Path "C:\Program Files\Eclipse Adoptium\jdk-17*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $javaPath = $found.FullName
    }
}

if (-not $javaPath) {
    Write-Host "❌ فشل في تثبيت Java 17. الرجاء تثبيته يدوياً." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Java 17 موجود في: $javaPath" -ForegroundColor Green

# تعيين JAVA_HOME
$env:JAVA_HOME = $javaPath
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# ============================================================
# 2. التحقق من Android SDK وتثبيته
# ============================================================
Write-Host ""
Write-Host "[2/6] التحقق من Android SDK..." -ForegroundColor Yellow

$sdkPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

if (-not (Test-Path $sdkPath)) {
    Write-Host "⚠️  Android SDK غير موجود. جاري التثبيت..." -ForegroundColor Yellow
    
    # تنزيل Command Line Tools
    $sdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $sdkZip = "$env:TEMP\sdk-tools.zip"
    $sdkTemp = "$env:TEMP\sdk-tools"
    
    Write-Host "   تنزيل Android SDK Tools..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $sdkUrl -OutFile $sdkZip -UseBasicParsing
    
    Expand-Archive -Path $sdkZip -DestinationPath $sdkTemp -Force
    
    # إنشاء مجلد SDK
    New-Item -ItemType Directory -Force -Path $sdkPath | Out-Null
    
    # نسخ الأدوات
    Copy-Item -Path "$sdkTemp\cmdline-tools" -Destination "$sdkPath" -Recurse -Force
    
    # تثبيت المنصات الأساسية
    Write-Host "   تثبيت Android SDK Platform 33..." -ForegroundColor Gray
    & "$sdkPath\cmdline-tools\bin\sdkmanager.bat" "platforms;android-33" "build-tools;33.0.0" --sdk_root=$sdkPath
}

Write-Host "✅ Android SDK موجود في: $sdkPath" -ForegroundColor Green

# ============================================================
# 3. إنشاء ملفات التهيئة
# ============================================================
Write-Host ""
Write-Host "[3/6] إنشاء ملفات التهيئة..." -ForegroundColor Yellow

# local.properties
$localProps = @"
sdk.dir=C:\\Users\\$env:USERNAME\\AppData\\Local\\Android\\Sdk
"@
$localProps | Out-File -FilePath "android\local.properties" -Encoding ASCII -Force

# gradle.properties
$gradleProps = @"
org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true
org.gradle.java.home=$($javaPath -replace '\\', '\\\\')
"@
$gradleProps | Out-File -FilePath "android\gradle.properties" -Encoding UTF8 -Force

Write-Host "✅ ملفات التهيئة جاهزة" -ForegroundColor Green

# ============================================================
# 4. بناء تطبيق React
# ============================================================
Write-Host ""
Write-Host "[4/6] بناء تطبيق React..." -ForegroundColor Yellow

# تنظيف
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
}

# بناء
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل في بناء React" -ForegroundColor Red
    exit 1
}
Write-Host "✅ تم بناء React بنجاح" -ForegroundColor Green

# ============================================================
# 5. نسخ الملفات إلى Android
# ============================================================
Write-Host ""
Write-Host "[5/6] نسخ الملفات إلى Android..." -ForegroundColor Yellow

npx cap copy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل في نسخ الملفات" -ForegroundColor Red
    exit 1
}
Write-Host "✅ تم نسخ الملفات بنجاح" -ForegroundColor Green

# ============================================================
# 6. بناء APK
# ============================================================
Write-Host ""
Write-Host "[6/6] بناء APK..." -ForegroundColor Yellow

Push-Location "android"
.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  تحذير: فشل في التنظيف، متابعة..." -ForegroundColor Yellow
}

.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل في بناء APK" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# ============================================================
# النتيجة النهائية
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ البناء اكتمل بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 ملف APK جاهز في:" -ForegroundColor Cyan
Write-Host "   android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "انسخ الملف إلى هاتفك وقم بتثبيته." -ForegroundColor Cyan