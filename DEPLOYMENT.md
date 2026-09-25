# 🚀 دليل نشر سيرفر أوميغا للذكاء الاصطناعي (Cloud Run / VPS Deployment Guide)

يقدم هذا الدليل الخطوات التفصيلية لنشر خادم أوميغا الذكي باستعمال **Firebase Admin SDK** المشدد على بيئات الإنتاج الحية (**Google Cloud Run** أو أي **VPS / Docker**).

---

## 1️⃣ النشر على Google Cloud Run (الموصى به)

### الخطوة 1: تجهيز أداة gcloud والتعريف بالمشروع
```bash
gcloud auth login
gcloud config set project lunar-storm-pwjkk
```

### الخطوة 2: بناء الصورة الحاوية (Container Image) ونشر الخدمة
```bash
# بناء الصورة ونشرها بطلب واحد على Cloud Run
gcloud run deploy omega-server \
  --source . \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,GEMINI_API_KEY=YOUR_GEMINI_KEY"
```

### الخطوة 3: إضافة متغير مفتاح الخدمة لـ Firebase Admin (FIREBASE_SERVICE_ACCOUNT)
1. اذهب إلى **Firebase Console** -> **Project Settings** -> **Service Accounts**.
2. اضغط **Generate new private key** ونظف الملف ليكون سطراً واحداً.
3. قم بضبط المتغير في Cloud Run:
```bash
gcloud run services update omega-server \
  --set-env-vars "FIREBASE_SERVICE_ACCOUNT='{\"type\":\"service_account\",...}'"
```

---

## 2️⃣ النشر على خادم خاص (VPS / Ubuntu / Docker Compose)

### الخطوة 1: استنسخ المشروع وجهز ملف `.env`
```bash
cp .env.example .env
nano .env
```

### الخطوة 2: التشغيل باستخدام Docker Compose
```bash
docker-compose up -d --build
```

### الخطوة 3: التحقق من صحة التشغيل
```bash
curl http://localhost:3000/api/health
```

---

## 🔒 الميزات الأمنيّة المطبقة في الخادم (Production Hardening)

1. **Firebase Admin SDK:** يعالج السيرفر جميع القراءات والكتابات بشكل مباشر، آمن، ومباشر دون الاعتماد على العميل.
2. **Firestore Security Rules:** قواعد مشددة تحظر وصول الغرباء وتفرض المصادقة والقيود التامة حسب `userId`.
3. **Rate Limiting:** تحديد معدل الطلبات المسموح لمنع هجمات الإغراق (DDoS & Wallet Exhaustion).
4. **Queue Authorization:** التحقق من التوكنات وتدقيق الحسابات لكل طلبات حوض المعالجة والاستدلال.
