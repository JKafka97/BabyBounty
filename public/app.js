let thingsRef;
let unsubscribe = () => {};

document.addEventListener("DOMContentLoaded", async () => {
    if (!firebase.apps.length) {
        console.error("Firebase not initialized!");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const provider = new firebase.auth.GoogleAuthProvider();

    // UI Elements
    const elements = {
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
    };

    elements.signInBtn.onclick = () => auth.signInWithPopup(provider);
    elements.signOutBtn.onclick = () => auth.signOut();

    auth.onAuthStateChanged(user => handleAuthStateChange(user, db, elements));
});

async function handleAuthStateChange(user, db, elements) {

    if (user) {
        const useryType = await getMyPermisions(user.uid, db);
        elements.giftCreationSection.hidden = "admin"!== useryType;
        setupThings(user, db, elements);
    } else {
        cleanupThings(elements.thingsList);
        setupThingsWithoutUser(db, elements.thingsList);
        elements.giftCreationSection.hidden = true;
    }
    updateUI(user, elements);
}

function updateUI(user, elements) {
    elements.whenSignedIn.hidden = !user;
    elements.whenSignedOut.hidden = !!user;
    elements.userDetails.innerHTML = user ? `<h3>Hello ${user.displayName}!</h3>` : '';
}

function cleanupThings(thingsList) {
    if (typeof unsubscribe === "function") unsubscribe();
    thingsList.innerHTML = '';
}

async function fetchUserDisplayName(db, userId) {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        return userDoc.exists ? userDoc.data().displayName : "Unknown User";
    } catch (error) {
        console.error("Error fetching user:", error);
        return "Unknown User";
    }
}

async function fetchUserDisplayNameWithName(db, userId, userName) {
    const userRef = db.collection("users").doc(userId);
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) await userRef.set({ displayName: userName });
        return (await userRef.get()).data().displayName || "Unknown User";
    } catch (error) {
        console.error("Error fetching user:", error);
        return "Unknown User";
    }
}

function setupThingsWithoutUser(db, thingsList) {
    thingsRef = db.collection('gifts');
    unsubscribe = thingsRef.orderBy('claimed').onSnapshot(async snapshot => {
        thingsList.innerHTML = await generateGiftListHTML(snapshot.docs, db);
    });
}

async function setupThings(user, db, elements) {
    thingsRef = db.collection('gifts');
    const userType = await getMyPermisions(user.uid, db); // Fetch user type
    elements.addGiftBtn.onclick = () => addGift(user, db, elements);

    unsubscribe = thingsRef.orderBy('claimed').onSnapshot(async snapshot => {
        elements.thingsList.innerHTML = await generateGiftListHTML(snapshot.docs, db, user, userType);
    });
}

async function generateGiftListHTML(docs, db, user = null, userType = "user") {
    return (await Promise.all(docs.map(async doc => {
        const data = doc.data();
        const displayName = data.claimedBy ? await fetchUserDisplayName(db, data.claimedBy) : "";
        const claimedByText = data.claimedBy 
            ? `<p class="text-muted">Claimed by: <strong>${data.claimedBy === user?.uid ? "You" : displayName}</strong></p>` 
            : "";

        const claimButton = user ? (data.claimed 
            ? (data.claimedBy === user.uid 
                ? `<button class="btn btn-danger w-100" onclick="unclaimGift('${doc.id}')">Unclaim</button>` 
                : "")
            : `<button class="btn btn-success w-100" onclick="claimGift('${doc.id}', '${user.uid}')">Claim</button>`)
            : "";
            const deleteButton = userType === "admin" 
            ? `<button class="btn btn-danger w-100" onclick="deleteGift('${doc.id}')">Delete</button>` 
            : "";
        return `<div class="card shadow-sm p-3 mb-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <img src="${data.picture}" alt="Gift Image" class="rounded" style="width: 100px; height: auto;">
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


function addGift(user, db, elements) {
    const giftName = elements.giftName.value.trim();
    const giftDescription = elements.giftDescription.value.trim();
    const giftPicture = elements.giftPicture.value.trim();

    if (!giftName || !giftDescription) {
        alert("Please enter both a gift name and a description.");
        return;
    }

    thingsRef.add({
        uid: user.uid,
        name: giftName,
        description: giftDescription,
        picture: giftPicture,
        claimed: false,
        claimedBy: null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        elements.giftName.value = "";
        elements.giftDescription.value = "";
    });
}

window.claimGift = function (giftId, userId) {
    thingsRef.doc(giftId).update({
        claimed: true,
        claimedBy: userId
    }).catch(error => console.error("Error claiming gift:", error));
};

window.unclaimGift = function (giftId) {
    thingsRef.doc(giftId).update({
        claimed: false,
        claimedBy: null
    }).catch(error => console.error("Error unclaiming gift:", error));
};

window.deleteGift = function (giftId) {
    if (confirm("Are you sure you want to delete this gift?")) {
        thingsRef.doc(giftId).delete()
            .catch(error => console.error("Error deleting gift:", error));
    }
};

async function getMyPermisions(userId, db) {
    const userRef = db.collection("userType").doc(userId);
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) await userRef.set({ userType: "user" });
        return (await userRef.get()).data().userType || "Unknown User";
    } catch (error) {
        console.error("Error fetching user:", error);
        return "Unknown User";
    }
}