// Tablica z predefiniowanymi produktami
const predefinedProducts = [
    "Reader RFID", "Detacher RFID", "Pager", "Pilot 4 kanały", 
    "Pilot 2 kanały", "Hyperguard centralka", "Hyperguard płytka", 
    "CPiD", "Zasilacz 24V", "Zasilacz 12V", "Wirama 2000", "Router GSM"
];

// Obsługa formularza dodawania produktów
document.getElementById("inventoryForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const productSelect = document.getElementById("product");
    const customProductInput = document.getElementById("customProductName");
    const product = productSelect.value === "Custom" ? customProductInput.value : productSelect.value;

    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const minQuantityInput = document.getElementById("minQuantity").value;
    const minQuantity = minQuantityInput ? parseInt(minQuantityInput, 10) : 0;

    if (product && quantity) {
        addToInventory(product, quantity, minQuantity);
        document.getElementById("inventoryForm").reset();
        customProductInput.style.display = "none"; // Ukryj pole po dodaniu
        if (productSelect.value === "Custom") {
            addProductToDropdown(product); // Dodaj nowy produkt do rozwijanej listy
        }
    }
});

// Funkcja dodająca nową opcję do listy rozwijanej
function addProductToDropdown(productName) {
    const productSelect = document.getElementById("product");
    
    // Sprawdź, czy produkt już istnieje na liście
    if (!Array.from(productSelect.options).some(option => option.value === productName) && productName.trim() !== "") {
        const newOption = document.createElement("option");
        newOption.value = productName;
        newOption.textContent = productName;

        productSelect.insertBefore(newOption, productSelect.querySelector('option[value="Custom"]')); // Wstaw przed "Custom"
    }
}

// Aktualizacja listy rozwijanej na podstawie zawartości localStorage
function updateDropdownFromStorage() {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    inventory.forEach(item => addProductToDropdown(item.product)); // Dodaj wszystkie produkty z magazynu
}

// Obsługa zmiany wyboru produktu
document.getElementById("product").addEventListener("change", function() {
    const customProductInput = document.getElementById("customProductName");
    if (this.value === "Custom") {
        customProductInput.style.display = "block"; // Pokaż pole dla custom
    } else {
        customProductInput.style.display = "none"; // Ukryj, jeśli inny produkt
    }
});

// Funkcja dodająca produkt do magazynu i zapisująca go w localStorage
function addToInventory(product, quantity, minQuantity) {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const existingProduct = inventory.find(item => item.product === product);

    if (existingProduct) {
        if (existingProduct.quantity + quantity < 0) {
            alert(`Nie masz tyle ${product}!`);
            return;
        }
        existingProduct.quantity += quantity;
        existingProduct.minQuantity = minQuantity || existingProduct.minQuantity;
    } else {
        if (quantity > 0) {
            inventory.push({ product, quantity, minQuantity });
            addProductToDropdown(product); // Dodaj nowy produkt do rozwijanej listy
        } else {
            alert("Nie można dodać produktu z ujemną ilością!");
            return;
        }
    }
    
    localStorage.setItem("inventory", JSON.stringify(inventory));
    updateInventoryList();
}

// Funkcja aktualizująca listę produktów z podświetleniem minimalnych stanów
function updateInventoryList() {
    const inventoryList = document.getElementById("productList");
    inventoryList.innerHTML = ""; 
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    inventory.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.product} - Ilość: ${item.quantity} (Min: ${item.minQuantity || 0})`;

        if (item.quantity <= item.minQuantity) {
            listItem.style.backgroundColor = 'red'; // Podświetlenie w przypadku niskiej ilości
        }

        listItem.addEventListener("click", () => selectProduct(item.product)); // Dodaj nasłuchiwanie na kliknięcie
        inventoryList.appendChild(listItem);
    });
}

// Funkcja wyboru produktu do edycji
function selectProduct(product) {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const selectedProduct = inventory.find(item => item.product === product);

    document.getElementById("product").value = product; // Ustaw nazwę produktu w polu
    document.getElementById("quantity").value = ""; // Ustaw ilość na pusty ciąg
    document.getElementById("minQuantity").value = selectedProduct ? selectedProduct.minQuantity : ""; // Ustaw minimalną ilość
}

// Obsługa przycisku usuwania
document.getElementById("removeButton").addEventListener("click", function() {
    const productSelect = document.getElementById("product");
    const productName = productSelect.value;

    // Zablokuj możliwość usuwania predefiniowanych produktów
    if (predefinedProducts.includes(productName)) {
        alert("Nie można usunąć predefiniowanego produktu.");
        return;
    }

    if (productName && productName !== "Custom") {
        removeProductFromDropdown(productName);
        removeProductFromInventory(productName);
        productSelect.value = ""; // Resetuj wybór
    } else {
        alert("Wybierz produkt do usunięcia.");
    }
});

// Obsługa przycisku czyszczenia
document.getElementById("clearButton").addEventListener("click", function() {
    if (confirm("Czy na pewno chcesz wyczyścić całą listę?")) {
        localStorage.removeItem("inventory"); // Usuń dane z localStorage
        updateInventoryList(); // Zaktualizuj widok listy
        document.getElementById("product").selectedIndex = 0; // Resetuj rozwijaną listę
    }
});

// Funkcja usuwająca produkt z listy rozwijanej
function removeProductFromDropdown(productName) {
    const productSelect = document.getElementById("product");
    const optionToRemove = Array.from(productSelect.options).find(option => option.value === productName);

    if (optionToRemove) {
        productSelect.removeChild(optionToRemove);
    }
}

// Funkcja usuwająca produkt z magazynu
function removeProductFromInventory(productName) {
    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    inventory = inventory.filter(item => item.product !== productName);
    localStorage.setItem("inventory", JSON.stringify(inventory)); // Zaktualizuj localStorage
    updateInventoryList(); // Odśwież listę produktów
}

// Funkcja eksportu danych do XLSX
document.getElementById("exportButton").addEventListener("click", function() {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const exportData = inventory.map(item => {
        const shortage = item.minQuantity - item.quantity > 0 ? item.minQuantity - item.quantity : 0;
        const orderText = shortage > 0 ? `Zamówić ${shortage}` : ""; // Tekst o brakującej ilości
        return {
            Produkt: item.product,
            Ilość: item.quantity,
            Minimalna: item.minQuantity || 0,
            Status: shortage > 0 ? 'Brak' : 'OK',
            Zamówienie: orderText // Dodaj informacje o zamówieniu
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    // Zapisz plik XLSX
    XLSX.writeFile(workbook, "inventory.xlsx");
});

// Inicjalizacja
updateDropdownFromStorage();
updateInventoryList();
