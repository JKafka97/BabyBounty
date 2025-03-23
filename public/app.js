let giftsRef;
let usersRef;
let usersTypeRef;

let unsubscribe = () => {};

document.addEventListener("DOMContentLoaded", async () => {
    if (!firebase.apps.length) {
        console.error("Firebase not initialized!");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const provider = new firebase.auth.GoogleAuthProvider();

    const elements = getElements();

    elements.signInBtn.onclick = () => auth.signInWithPopup(provider);
    elements.signOutBtn.onclick = () => auth.signOut();

    elements.downloadDbBtn.onclick = downloadDatabase;
    elements.importDbBtn.onclick = () => document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = importDatabase;
    
    auth.onAuthStateChanged(user => handleAuthStateChange(user, db, elements));
});

function getElements() {
    return {
        whenSignedIn: document.getElementById('whenSignedIn'),
        whenSignedOut: document.getElementById('whenSignedOut'),
        signInBtn: document.getElementById('signInBtn'),
        signOutBtn: document.getElementById('signOutBtn'),
        userDetails: document.getElementById('userDetails'),
        thingsList: document.getElementById('thingsList'),
        giftCreationSection: document.getElementById("giftCreationSection"),
        addGiftBtn: document.getElementById('addGiftBtn'),
        giftName: document.getElementById('giftName'),
        giftDescription: document.getElementById('giftDescription'),
        giftPicture: document.getElementById('giftPicture'),
        downloadDbBtn: document.getElementById('export'),
        importDbBtn: document.getElementById('import'),
        dbSection: document.getElementById('dbBackup'),
    };
}

async function handleAuthStateChange(user, db, elements) {
    giftsRef = db.collection('gifts');
    usersRef = db.collection('users');
    usersTypeRef = db.collection('userType');

    if (user) {
        const userType = await getUserPermissions(user.uid);
        elements.giftCreationSection.hidden = userType !== "admin";
        elements.dbSection.hidden = userType !== "admin"
        setupThings(user, db, elements, userType);
    } else {
        resetThingsList(elements.thingsList);
        setupThingsWithoutUser(db, elements.thingsList);
        elements.giftCreationSection.hidden = true;
        elements.dbSection.hidden = true;
    }
    updateUI(user, elements);
}

function updateUI(user, elements) {
    elements.whenSignedIn.hidden = !user;
    elements.whenSignedOut.hidden = !!user;
    elements.userDetails.innerHTML = user ? `<h3>Ahoj ${user.displayName}!</h3>` : '';
}

function resetThingsList(thingsList) {
    if (typeof unsubscribe === "function") unsubscribe();
    thingsList.innerHTML = '';
}

async function fetchUserDisplayName(db, userId) {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        return userDoc.exists ? userDoc.data().displayName : "Neznámý uživatel";
    } catch (error) {
        console.error("Error fetching user:", error);
        return "Neznámý uživatel";
    }
}

function setupThingsWithoutUser(db, thingsList) {
    unsubscribe = giftsRef.orderBy('claimed').onSnapshot(async snapshot => {
        thingsList.innerHTML = await generateGiftListHTML(snapshot.docs, db);
    });
}

async function setupThings(user, db, elements, userType) {
    elements.addGiftBtn.onclick = () => addGift(user, elements);

    unsubscribe = giftsRef.orderBy('claimed').onSnapshot(async snapshot => {
        elements.thingsList.innerHTML = await generateGiftListHTML(snapshot.docs, db, user, userType);
    });
}

async function generateGiftListHTML(docs, db, user = null, userType = "user") {
    return (await Promise.all(docs.map(async doc => {
        const data = doc.data();
        const displayName = data.claimedBy ? await fetchUserDisplayName(db, data.claimedBy) : "";
        const claimedByText = data.claimedBy ? `<p class="text-muted">Zarezervoval si: <strong>${data.claimedBy === user?.uid ? "Ty" : displayName}</strong></p>` : "";
        
        const claimButton = user ? (data.claimed 
            ? (data.claimedBy === user.uid 
                ? `<button class="btn btn-danger w-100" onclick="unclaimGift('${doc.id}')">Odebrat rezervaci</button>` 
                : "")
            : `<button class="btn btn-success w-100" onclick="claimGift('${doc.id}', '${user.uid}', '${user.displayName}')">Rezervovat</button>`) 
            : "";
        
        const deleteButton = userType === "admin" 
            ? `<button class="btn btn-danger w-100" onclick="deleteGift('${doc.id}')">Odebrat</button>` 
            : "";
        
        return `<div class="card shadow-sm p-3 mb-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <img id="card-image" src="${data.picture}" alt="Gift Image" class="rounded">
                </div>
                <div class="col">
                    <h5 class="mb-1">${data.name}</h5>
                    <p class="mb-1">${data.description}</p>
                    ${claimedByText}
                    ${claimButton}
                    ${deleteButton}
                </div>
            </div>
        </div>`;
    }))).join('');
}

function addGift(user, elements) {
    const { giftName, giftDescription, giftPicture } = elements;
    
    if (!giftName.value.trim() || !giftDescription.value.trim()) {
        alert("Please enter both a gift name and a description.");
        return;
    }

    giftsRef.add({
        uid: user.uid,
        name: giftName.value.trim(),
        description: giftDescription.value.trim(),
        picture: giftPicture.value.trim(),
        claimed: false,
        claimedBy: null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        giftName.value = "";
        giftDescription.value = "";
    });
}

window.claimGift = function (giftId, userId, userName) {
    addUser(userName,userId)
    giftsRef.doc(giftId).update({
        claimed: true,
        claimedBy: userId
    }).catch(error => console.error("Error claiming gift:", error));
};

window.unclaimGift = function (giftId) {
    giftsRef.doc(giftId).update({
        claimed: false,
        claimedBy: null
    }).catch(error => console.error("Error unclaiming gift:", error));
};

window.deleteGift = function (giftId) {
    if (confirm("Are you sure you want to delete this gift?")) {
        giftsRef.doc(giftId).delete()
            .catch(error => console.error("Error deleting gift:", error));
    }
};

function addUser(userName,userId){
    try{
    userSelect = usersRef.doc(userId)
    const userDoc = userSelect.get();
    if (!userDoc.exists) userSelect.set({ displayName: userName });
    } catch{
        console.error("Error adding user:", userName);
    }
}

async function getUserPermissions(userId) {
    try {
        userTypeSelect = usersTypeRef.doc(userId)
        const userDoc = await userTypeSelect.get();
        if (!userDoc.exists) await userTypeSelect.set({ userType: "user" });
        return (await userTypeSelect.get()).data().userType || "user";
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return "user";
    }
}


async function downloadDatabase() {
    const db = firebase.firestore();
    const collections = ["gifts", "users", "userType"];
    let dbData = {};

    for (let collection of collections) {
        const snapshot = await db.collection(collection).get();
        dbData[collection] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "database_backup.json";
    a.click();
}

async function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const db = firebase.firestore();
            const data = JSON.parse(e.target.result);

            for (let collection in data) {
                for (let doc of data[collection]) {
                    const { id, ...docData } = doc;
                    await db.collection(collection).doc(id).set(docData);
                }
            }
            alert("Database imported successfully!");
        } catch (error) {
            console.error("Error importing database:", error);
        }
    };
    reader.readAsText(file);
}
