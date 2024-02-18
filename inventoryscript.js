// inventoryscript.js

let db;
window.onload = function() {
    let request = window.indexedDB.open('InventoryDB', 1);

    request.onerror = function() {
        console.log('Database failed to open');
    };

    request.onsuccess = function() {
        db = request.result;
        displayItems();
    };

    request.onupgradeneeded = function(e) {
        let db = e.target.result;
        let objectStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('item', 'item', { unique: false });
        objectStore.createIndex('purchaseDate', 'purchaseDate', { unique: false });
        objectStore.createIndex('expiryDate', 'expiryDate', { unique: false });
    };
};

function addItem() {
    document.getElementById('addItemPopup').style.display = 'block';
    document.getElementById('itemName').value = ''; // Clear previous values
    document.getElementById('purchaseDate').value = '';
    document.getElementById('expiryDate').value = '';
    setDefaultDates();
}

function closePopup() {
    document.getElementById('addItemPopup').style.display = 'none';
}

function setDefaultDates() {
    const today = new Date();
    const nextMonth = new Date(new Date().setMonth(today.getMonth() + 1));
    document.getElementById('purchaseDate').value = today.toISOString().split('T')[0];
    document.getElementById('expiryDate').value = nextMonth.toISOString().split('T')[0];
}

function submitItem() {
    const item = document.getElementById('itemName').value;
    const purchaseDate = document.getElementById('purchaseDate').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const newItem = { item, purchaseDate, expiryDate };
    const transaction = db.transaction(['inventory'], 'readwrite');
    const objectStore = transaction.objectStore('inventory');
    const request = objectStore.add(newItem);
    request.onsuccess = () => {
        displayItems();
        closePopup();
    };
}

function displayItems() {
    const tbody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Clear existing items before displaying updated list

    let objectStore = db.transaction('inventory').objectStore('inventory');
    objectStore.openCursor().onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            const newRow = tbody.insertRow();
            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            const cell4 = newRow.insertCell(3); // Cell for the delete button

            cell1.textContent = cursor.value.item;
            cell2.textContent = cursor.value.purchaseDate;
            cell3.textContent = cursor.value.expiryDate;

            // Create a delete button and set its event listener
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.setAttribute('data-id', cursor.key); // Set a data attribute with the item's ID
            deleteBtn.addEventListener('click', function() {
                // Use the data-id attribute to ensure the correct ID is passed
                deleteItem(this.getAttribute('data-id'));
            });
            cell4.appendChild(deleteBtn);

            cursor.continue();
        }
    };
}

function deleteItem(id) {
    // Convert id to the correct type if necessary
    const numericId = Number(id); // Use this line if your IDs are numeric
    const transaction = db.transaction(['inventory'], 'readwrite');
    const objectStore = transaction.objectStore('inventory');
    
    // Use numericId if IDs are numbers, otherwise just use id
    objectStore.delete(numericId).onsuccess = function() {
        console.log('Item deleted');
        displayItems(); // Refresh the list to show the change
    };
}
