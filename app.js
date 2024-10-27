
// Tablica z predefiniowanymi produktami
const predefinedProducts = [
    "Reader RFID", "Detacher RFID", "Pager", "Pilot 4 kanały", 
    "Pilot 2 kanały", "Hyperguard centralka", "Hyperguard płytka", 
    "CPiD", "Zasilacz 24V", "Zasilacz 12V", "Wirama 2000", "Router GSM", "Wirama 1500", "CQR4(rolka)", "CQR6(rolka)", "Kabel USB A" 
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

    // Sprawdź, czy produkt jest predefiniowany
    if (predefinedProducts.includes(productName)) {
        alert("Po chuj usuwasz? 😎");
        return;
    }

    // Sprawdź, czy wybrano produkt do usunięcia
    if (productName && productName !== "Custom") {
        const confirmDelete = confirm(`Czy na pewno chcesz usunąć ${productName} z listy?`);
        
        // Usuwaj tylko jeśli użytkownik potwierdzi
        if (confirmDelete) {
            removeProductFromDropdown(productName);
            removeProductFromInventory(productName);
            productSelect.value = ""; // Resetuj wybór
        }
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

// document.getElementById("helpButton").addEventListener("click", function() {
//     // Utwórz nowe okno pomocy
//     const helpWindow = window.open("", "HelpWindow", "width=400,height=600");

//     // Wypełnij zawartość nowego okna
//     helpWindow.document.write(`
//         <html>
//         <head>
//             <title>Help</title>
//             <style>
//                 body { font-family: Arial, sans-serif; padding: 20px; }
//                 h2 { text-align: center; }
//                 p { margin: 10px 0; }
//                 #closeButton {
//                     display: block;
//                     margin: 20px auto;
//                     padding: 10px 20px;
//                     font-size: 16px;
//                     cursor: pointer;
//                 }
//             </style>
//         </head>
//         <body>
//             <h2 style="font-size:3rem">Jak korzystać z aplikacji</h2>
//             <p style="font-size:2rem"><strong>Eksport</strong> - eksportuje stan części do pliku excel.</p>
//             <p style="font-size:2rem"><strong>Wyczyść</strong> - czyści listę wszystkich części, ktore są na Twoim stanie.</p>
//             <p style="font-size:2rem"><strong>Usuń</strong> - usuwa konretna pozycje z listy całkowicie(po usunięciu trzeba dodać ją na nowo.</p>
//             <p style="font-size:2rem"><strong>Custom</strong> - na rozwijanej liście jest napis custom. To jest funkcja dodania nowego produktu do listy.</p>
//             <button id="closeButton" style="font-size:2rem; backgroud-color: #333">Zamknij</button>
//         </body>
//         </html>
//     `);

//     // Zamknij okno pomocy po kliknięciu przycisku „Zamknij”
//     helpWindow.document.getElementById("closeButton").onclick = function() {
//         helpWindow.close();
//     };
// });

document.getElementById("feedbackButton").addEventListener("click", function() {
    const email = "mateusz.walczak@checkpt.com"; // Wstaw swój adres e-mail
    const subject = encodeURIComponent("Feedback odnośnie aplikacji magazynowej"); // Temat wiadomości
    const body = encodeURIComponent(""); // Przykładowa treść wiadomości
    
    // Otwórz aplikację pocztową z wstępnie wypełnionymi danymi
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
});

// Funkcja eksportu danych do JSON
function exportToJson() {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const jsonData = JSON.stringify(inventory, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.json";
    a.click();
    URL.revokeObjectURL(url);
}

// Funkcja importu danych z JSON
function importFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            localStorage.setItem("inventory", JSON.stringify(importedData));
            updateInventoryList();
            updateDropdownFromStorage();
            alert("Import zakończony pomyślnie!");
        } catch (e) {
            alert("Błąd podczas importu. Upewnij się, że plik jest poprawny.");
        }
    };
    reader.readAsText(file);
}

document.getElementById("helpButton").addEventListener("click", function() {
    // Tworzenie nowego okna pomocy
    const helpWindow = window.open("", "HelpWindow", "width=400,height=600");
    helpWindow.document.write(`
        <html>
        <head>
            <title>Pomoc</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                p { margin: 10px 0; }
                #closeButton {
                    display: block;
                    margin: 20px auto;
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                }
                #importFileInput {
                    display: none;
                }
            </style>
        </head>
        <body>
            <h2 style="font-size:3rem">Jak korzystać z aplikacji</h2>
            <p style="font-size:2rem"><strong>Eksport</strong> - eksportuje stan części do pliku excel.</p>
            <p style="font-size:2rem"><strong>Wyczyść</strong> - czyści listę wszystkich części, które są na Twoim stanie.</p>
            <p style="font-size:2rem"><strong>Usuń</strong> - usuwa konretną pozycję z listy całkowicie (po usunięciu trzeba dodać ją na nowo).</p>
            <p style="font-size:2rem"><strong>Custom</strong> - na rozwijanej liście jest napis custom. To jest funkcja dodania nowego produktu do listy.</p>
            <p style="font-size:2rem"><strong>Eksport JSON</strong> - <button onclick="window.opener.exportToJson()">Eksport do JSON</button></p>
            <p style="font-size:2rem"><strong>Import JSON</strong> - <button onclick="document.getElementById('importFileInput').click()">Importuj z JSON</button></p>
            <input type="file" id="importFileInput" onchange="window.opener.importFromJson(event)">
            <button id="closeButton" style="font-size:2rem; backgroud-color: #333">Zamknij</button>
        </body>
        </html>
    `);

    // Zamknij okno pomocy po kliknięciu przycisku „Zamknij”
    helpWindow.document.getElementById("closeButton").onclick = function() {
        helpWindow.close();
    };
});


// Inicjalizacja
updateDropdownFromStorage();
updateInventoryList();
