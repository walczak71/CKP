// Obsługa formularza dodawania produktów
document.getElementById("inventoryForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const product = document.getElementById("product").value;
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const minQuantityInput = document.getElementById("minQuantity").value;
    const minQuantity = minQuantityInput ? parseInt(minQuantityInput, 10) : 0; // Ustaw minimalną ilość

    if (product && quantity) {
        addToInventory(product, quantity, minQuantity);
        document.getElementById("inventoryForm").reset();
    }
});

// Funkcja dodająca produkt do magazynu i zapisująca go w localStorage
function addToInventory(product, quantity, minQuantity) {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const existingProduct = inventory.find(item => item.product === product);

    if (existingProduct) {
        // Jeśli ilość po aktualizacji będzie poniżej 0, wyświetl ostrzeżenie
        if (existingProduct.quantity + quantity < 0) {
            alert(`Nie masz tyle ${product} baranie!`);
            return; // Przerwij, jeśli ilość byłaby ujemna
        }
        existingProduct.quantity += quantity;
        existingProduct.minQuantity = minQuantity || existingProduct.minQuantity; // Aktualizuj minimalną ilość
    } else {
        // Dodaj nowy produkt, tylko jeśli ilość jest większa od 0
        if (quantity > 0) {
            inventory.push({ product, quantity, minQuantity }); // Dodaj minimalną ilość
        } else {
            alert("Nie można dodać produktu z ujemną ilością!");
            return; // Przerwij, jeśli próbujemy dodać produkt z ujemną ilością
        }
    }
    
    localStorage.setItem("inventory", JSON.stringify(inventory));
    updateInventoryList();
}

// Funkcja aktualizująca listę produktów z podświetleniem minimalnych stanów
function updateInventoryList() {
    const inventoryList = document.getElementById("productList");
    inventoryList.innerHTML = ""; // Resetuj listę
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    inventory.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.product} - Ilość: ${item.quantity} (Min: ${item.minQuantity || 0})`;

        // Podświetlenie tła, jeśli ilość jest mniejsza lub równa minimalnej ilości
        if (item.quantity <= item.minQuantity) {
            listItem.style.backgroundColor = 'red'; // Ustaw tło na czerwono
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

// Obsługa eksportu do pliku XLSX
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

    // Dodanie formatowania
    exportData.forEach((item, index) => {
        if (item.Minimalna > item.Ilość) {
            const row = index + 1; // Excel row index (1-based)

            // Ustawienia dla komórek Status i Zamówienie
            const statusCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })]; // Status
            const orderCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]; // Zamówienie
            
            if (statusCell) {
                statusCell.s = {
                    fill: {
                        fgColor: { rgb: "FF0000" } // Czerwony kolor tła
                    }
                };
            }

            if (orderCell) {
                orderCell.s = {
                    fill: {
                        fgColor: { rgb: "FF0000" } // Czerwony kolor tła
                    }
                };
            }
        }
    });

    // Zapisz plik jako XLSX
    XLSX.writeFile(workbook, "inventory.xlsx");
});

// Aktualizacja listy produktów przy załadowaniu strony
window.addEventListener("load", function() {
    updateInventoryList();
});
