import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ===== ใส่ firebaseConfig ของคุณ =====
const firebaseConfig = {
  apiKey: "AIzaSyCgmB-hrpSwLvSxTh4zsNVFdYltFUIKFRs",
  authDomain: "system-base-38187.firebaseapp.com",
  projectId: "system-base-38187",
  storageBucket: "system-base-38187.firebasestorage.app",
  messagingSenderId: "358619730041",
  appId: "1:358619730041:web:4783c527a5dca13cf644a8"
};


// ===== Initialize Firebase =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===== พิกัดออฟฟิศ (แก้เป็นของจริง) =====
const officeLat = 13.7563;
const officeLng = 100.5018;
const maxDistance = 100; // เมตร


// ===== ฟังก์ชันคำนวณระยะทาง =====
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a =
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}


// ===== ตรวจสอบ login =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
  } else {
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("appSection").style.display = "none";
  }
});


// ===== Register =====
window.register = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await createUserWithEmailAndPassword(auth, email, password);
  alert("สมัครสมาชิกสำเร็จ");
}


// ===== Login =====
window.login = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await signInWithEmailAndPassword(auth, email, password);
  alert("เข้าสู่ระบบสำเร็จ");
}


// ===== Logout =====
window.logout = async function() {
  await signOut(auth);
}


// ===== ตอกบัตร =====
window.checkIn = async function() {

  if (!navigator.geolocation) {
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const distance = getDistance(lat, lng, officeLat, officeLng);

    let locationType = "offsite";

    if (distance <= maxDistance) {
      locationType = "office";
    }

    await addDoc(collection(db, "timeclock"), {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      latitude: lat,
      longitude: lng,
      locationType: locationType,
      distanceFromOffice: distance,
      timestamp: serverTimestamp()
    });

    alert("บันทึกเวลาเรียบร้อย (" + locationType + ")");

  }, () => {
    alert("ไม่สามารถดึงตำแหน่งได้");
  });
};
