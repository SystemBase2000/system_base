import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ===== FIREBASE CONFIG =====
const firebaseConfig = {
apiKey: "AIzaSyCgmB-hrpSwLvSxTh4zsNVFdYltFUIKFRs",
  authDomain: "system-base-38187.firebaseapp.com",
  projectId: "system-base-38187",
  storageBucket: "system-base-38187.firebasestorage.app",
  messagingSenderId: "358619730041",
  appId: "1:358619730041:web:4783c527a5dca13cf644a8"
};


// ===== INITIALIZE =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===== OFFICE LOCATION =====
const officeLat = 13.7563;
const officeLng = 100.5018;
const maxDistance = 100;


// ===== DISTANCE FUNCTION =====
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


// ===== GENERATE DEVICE ID =====
function getDeviceId() {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}


// ===== AUTH STATE =====
onAuthStateChanged(auth, async (user) => {

  if (user) {

    document.getElementById("loginSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const deviceId = getDeviceId();

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: "",
        role: "employee",
        deviceId: deviceId,
        position: "",
        workMode: "office"
      });
    } else {
      const data = userSnap.data();
      if (data.deviceId !== deviceId) {
        alert("อุปกรณ์นี้ไม่ได้รับอนุญาต");
        location.reload();
      }
    }

  } else {
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("appSection").style.display = "none";
  }
});


// ===== REGISTER =====
window.register = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  await createUserWithEmailAndPassword(auth, email, password);
  alert("สมัครสำเร็จ");
};


// ===== LOGIN =====
window.login = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  await signInWithEmailAndPassword(auth, email, password);
};


// ===== CLOCK IN / OUT =====
window.checkIn = async function() {

  if (!navigator.geolocation) {
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const user = auth.currentUser;
    const today = new Date().toISOString().split("T")[0];
    const docId = user.uid + "_" + today;

    const attendanceRef = doc(db, "attendance", docId);
    const attendanceSnap = await getDoc(attendanceRef);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (userData.workMode === "office") {
      const distance = getDistance(lat, lng, officeLat, officeLng);
      if (distance > maxDistance) {
        alert("คุณอยู่นอกพื้นที่ออฟฟิศ");
        return;
      }
    }

    if (!attendanceSnap.exists()) {

      await setDoc(attendanceRef, {
        uid: user.uid,
        date: today,
        clockIn: serverTimestamp(),
        locationIn: { lat: lat, lng: lng },
        clockOut: null,
        locationOut: null
      });

      alert("Clock In สำเร็จ");

    } else {

      const data = attendanceSnap.data();

      if (!data.clockOut) {

        await updateDoc(attendanceRef, {
          clockOut: serverTimestamp(),
          locationOut: { lat: lat, lng: lng }
        });

        alert("Clock Out สำเร็จ");

      } else {
        alert("วันนี้คุณตอกครบแล้ว");
      }
    }

  });
};

