// Inicjalizacja Supabase
const SUPABASE_URL = 'https://gdjvdgonmsttuwkbkwor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkanZkZ29ubXN0dHV3a2Jrd29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NzMzNDAsImV4cCI6MjA0NTU0OTM0MH0.xGkWeOOgrPk0G-kzaeao6Ki5L8E-5Nb-K5jcjWdkyRw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tablica z predefiniowanymi produktami
const predefinedProducts = [
    "Reader RFID", "Detacher RFID", "Pager", "Pilot 4 kanały", "Pilot 2 kanały", "Hyperguard centralka", 
    "Hyperguard płytka", "CPiD", "Zasilacz 24V", "Zasilacz 12V", "Wirama 2000", "Router GSM", 
    "Wirama 1500", "CQR4(rolka)", "CQR6(rolka)", "Kabel USB A", "TR4240", "TR7240", "SOM NP10", 
    "SOM NP20", "Elektronika 3G", "Elmes 2 kanały", "Elmes 4 kanały" 
];

let inventoryData = [];

// Wczytywanie danych magazynowych z Supabase
async function loadInventory() {
    const { data, error } = await supabaseClient.from('inventory').select('*');
    if (error) {
        console.error('Błąd wczytywania danych:', error);
    } else {
        inventoryData = data; // Przechowuj dane w globalnej zmiennej
        data.forEach(item => addProductToDropdown(item.product));
        updateInventoryList(data);
    }
}

// Dodawanie produktu do listy rozwijanej
function addProductToDropdown(productName) {
    const productSelect = document.getElementById("product");
    if (!Array.from(productSelect.options).some(option => option.value === productName) && productName.trim() !== "") {
        const newOption = document.createElement("option");
        newOption.value = productName;
        newOption.textContent = productName;
        productSelect.insertBefore(newOption, productSelect.querySelector('option[value="Custom"]'));
    }
}

// Obsługa formularza dodawania produktów
document.getElementById("inventoryForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const productSelect = document.getElementById("product");
    const customProductInput = document.getElementById("customProductName");
    const product = productSelect.value === "Custom" ? customProductInput.value : productSelect.value;
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const minQuantity = parseInt(document.getElementById("minQuantity").value, 10) || 0;

    if (product && quantity) {
        await addToInventory(product, quantity, minQuantity);
        document.getElementById("inventoryForm").reset();
        customProductInput.style.display = "none"; 
        if (productSelect.value === "Custom") addProductToDropdown(product);
    }
});

// Dodawanie produktu do magazynu i zapis w Supabase
async function addToInventory(product, quantity, minQuantity) {
    const { data, error } = await supabaseClient.from('inventory').insert([{ product, quantity, minQuantity }]);
    if (error) {
        console.error('Błąd dodawania produktu:', error);
        return;
    }

    loadInventory();
}

// Aktualizacja listy produktów z podświetleniem niskich stanów
function updateInventoryList(data) {
    const inventoryList = document.getElementById("productList");
    inventoryList.innerHTML = ""; // Wyczyść poprzednie elementy listy

    data.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.product} - Ilość: ${item.quantity} (Min: ${item.minQuantity || 0})`;

        // Dodaj zdarzenie kliknięcia do elementu listy
        listItem.addEventListener('click', function() {
            const productSelect = document.getElementById("product");
            productSelect.value = item.product; // Ustaw wybrany produkt w liście rozwijanej

            const customProductInput = document.getElementById("customProductName");
            customProductInput.style.display = "none"; // Ukryj pole niestandardowego produktu
            customProductInput.value = ""; // Wyczyść pole, aby nie pozostawiać starej wartości

            // Ustaw minimalny stan w odpowiednim polu
            document.getElementById("minQuantity").value = item.minQuantity || 0; // Ustaw minimalny stan
        });

        if (item.quantity <= item.minQuantity) {
            listItem.style.backgroundColor = 'red'; // Podświetlenie niskiego stanu
        }
        inventoryList.appendChild(listItem); // Dodaj element do listy
    });
}

// Inicjalizacja danych
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();

    // Obsługa zmiany wyboru produktu
    const productSelect = document.getElementById("product");
    const customProductInput = document.getElementById("customProductName");

    productSelect.addEventListener('change', function() {
        if (productSelect.value === "Custom") {
            customProductInput.style.display = "block"; // Pokaż pole do wprowadzenia nazwy
            customProductInput.value = ""; // Wyczyść pole, aby użytkownik mógł wpisać nową nazwę
        } else {
            customProductInput.style.display = "none"; // Ukryj pole, jeśli inny produkt jest wybrany
            customProductInput.value = ""; // Wyczyść pole, aby nie pozostawiać starej wartości

            // Wyszukaj produkt, aby ustawić minimalny stan
            const selectedProduct = inventoryData.find(item => item.product === productSelect.value);
            if (selectedProduct) {
                document.getElementById("minQuantity").value = selectedProduct.minQuantity || 0; // Ustaw minimalny stan
            }
        }
    });
});

async function removeProduct(productName) {
    // Usuwanie produktu z bazy danych
    const { error } = await supabaseClient.from('inventory').delete().eq('product', productName);
    if (error) {
        console.error('Błąd usuwania produktu:', error);
    } else {
        console.log("Produkt usunięty pomyślnie.");
    }
}

// Obsługa przycisku usuwania
document.getElementById("removeButton").addEventListener("click", async function() {
    const productSelect = document.getElementById("product");
    const productName = productSelect.value;

    if (predefinedProducts.includes(productName)) {
        alert("Nie można usunąć tego produktu.");
        return;
    }

    if (productName && productName !== "Custom") {
        const confirmDelete = confirm(`Czy na pewno chcesz usunąć ${productName} z listy?`);
        if (confirmDelete) {
            await removeProduct(productName); // Usunięcie produktu z bazy danych
            
            // Usunięcie opcji z dropdowna
            const optionToRemove = Array.from(productSelect.options).find(option => option.value === productName);
            if (optionToRemove) {
                productSelect.remove(optionToRemove.index); // Usuń opcję z dropdowna
                console.log("Opcja usunięta z dropdowna:", productName);
            } else {
                console.error("Nie znaleziono opcji do usunięcia:", productName);
            }
            
            productSelect.value = ""; // Wyczyść wartość dropdowna
        }
    } else {
        alert("Wybierz produkt do usunięcia.");
    }
});






// Obsługa przycisku czyszczenia
document.getElementById("clearButton").addEventListener("click", async function() {
    if (confirm("Czy na pewno chcesz wyczyścić całą listę?")) {
        // Wywołanie funkcji TRUNCATE
        const { error } = await supabaseClient.rpc('truncate_inventory');
        if (error) {
            console.error('Błąd czyszczenia magazynu:', error);
        } else {
            loadInventory(); // Ładuj dane po wyczyszczeniu
        }
    }
});

// Funkcja eksportu danych do XLSX
document.getElementById("exportButton").addEventListener("click", async function() {
    const { data, error } = await supabaseClient.from('inventory').select('*');
    if (error) {
        console.error('Błąd pobierania danych do eksportu:', error);
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    // Zapisz plik XLSX
    XLSX.writeFile(workbook, 'inventory.xlsx');
});

// Obsługa przycisku feedback
document.getElementById("feedbackButton").addEventListener("click", function() {
    const recipientEmail = "mateusz.walczak@checkpt.com"; // Zastąp swoim adresem e-mail
    const subject = "Feedback z aplikacji magazynowej"; // Ustaw tytuł e-maila
    const body = ""; // Opcjonalny domyślny tekst wiadomości

    // Otwórz okno poczty z predefiniowanymi wartościami
    window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Obsługa przycisku "Help"
document.getElementById("helpButton").addEventListener("click", function() {
    // Tutaj możesz dostosować treść okna pomocy
    const helpMessage = `
        <h2>Pomoc</h2>
        <p>Aby dodać produkt do magazynu:</p>
        <ol>
            <li>Wybierz produkt z listy rozwijanej lub wprowadź niestandardową nazwę.</li>
            <li>Wprowadź ilość i minimalny stan.</li>
            <li>Kliknij "Dodaj".</li>
        </ol>
        <p>Aby usunąć produkt, wybierz go z listy rozwijanej i kliknij "Usuń".</p>
        <p>Aby wyczyścić magazyn, kliknij "Wyczyść".</p>
        <p>Aby eksportować dane, kliknij "Eksportuj".</p>
    `;

    // Tworzenie okna dialogowego
    const helpWindow = document.createElement("div");
    helpWindow.style.position = "fixed";
    helpWindow.style.top = "50%";
    helpWindow.style.left = "50%";
    helpWindow.style.transform = "translate(-50%, -50%)";
    helpWindow.style.backgroundColor = "white";
    helpWindow.style.padding = "40px";
    helpWindow.style.width = "80%";   // Szerokość okna
    helpWindow.style.height = "auto";  // Wysokość okna
    helpWindow.style.borderRadius = "3%";

    helpWindow.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    helpWindow.style.zIndex = "1000";

    // Dodawanie treści do okna pomocy
    helpWindow.innerHTML = helpMessage;

    // Dodawanie przycisku do zamknięcia okna
    const closeButton = document.createElement("button");
    closeButton.textContent = "Zamknij";
    closeButton.style.marginTop = "10px";
    closeButton.addEventListener("click", function() {
        document.body.removeChild(helpWindow); // Usuń okno po kliknięciu
    });

    helpWindow.appendChild(closeButton);
    document.body.appendChild(helpWindow); // Dodaj okno do ciała dokumentu
});

// Reszta kodu (np. inicjalizacja, obsługa formularza itp.) pozostaje bez zmian...


// Inicjalizacja elementów DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicjalizacja przycisków
    document.getElementById("removeButton").addEventListener("click", removeProduct);
    document.getElementById("clearButton").addEventListener("click", clearButton);
    document.getElementById("exportButton").addEventListener("click", exportButton);
});