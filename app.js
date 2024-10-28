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

// Inicjalizacja danych
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
});

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

// Wczytywanie danych magazynowych z Supabase
async function loadInventory() {
    const { data, error } = await supabaseClient.from('inventory').select('*');
    if (error) {
        console.error('Błąd wczytywania danych:', error);
    } else {
        data.forEach(item => addProductToDropdown(item.product));
        updateInventoryList(data);
    }
}

// Dodawanie produktu do magazynu i zapis w Supabase
async function addToInventory(product, quantity, minQuantity) {
    const { data, error } = await supabaseClient.from('inventory').select('*').eq('product', product).single();
    if (error && error.code !== 'PGRST116') {
        console.error('Błąd pobierania produktu:', error);
        return;
    }

    if (data) {
        const newQuantity = data.quantity + quantity;
        if (newQuantity < 0) {
            alert(`Nie masz tyle ${product}!`);
            return;
        }

        await supabaseClient.from('inventory').update({ quantity: newQuantity, minQuantity: minQuantity || data.minQuantity }).eq('product', product);
    } else {
        if (quantity > 0) {
            await supabaseClient.from('inventory').insert([{ product, quantity, minQuantity: minQuantity }]);
            addProductToDropdown(product);
        } else {
            alert("Nie można dodać produktu z ujemną ilością!");
            return;
        }
    }
    loadInventory();
}

// Aktualizacja listy produktów z podświetleniem niskich stanów
function updateInventoryList(data) {
    const inventoryList = document.getElementById("productList");
    inventoryList.innerHTML = "";

    data.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.product} - Ilość: ${item.quantity} (Min: ${item.minQuantity || 0})`;

        if (item.quantity <= item.minQuantity) {
            listItem.style.backgroundColor = 'red';
        }
        inventoryList.appendChild(listItem);
    });
}

// Usuwanie produktu
async function removeProduct(productName) {
    const { error } = await supabaseClient.from('inventory').delete().eq('product', productName);
    if (error) {
        console.error('Błąd usuwania produktu:', error);
    } else {
        loadInventory();
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
            await removeProduct(productName);
            productSelect.value = "";
        }
    } else {
        alert("Wybierz produkt do usunięcia.");
    }
});

// Obsługa przycisku czyszczenia
document.getElementById("clearButton").addEventListener("click", async function() {
    if (confirm("Czy na pewno chcesz wyczyścić całą listę?")) {
        const { error } = await supabaseClient.from('inventory').delete();
        if (error) {
            console.error('Błąd czyszczenia magazynu:', error);
        } else {
            loadInventory();
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

    const exportData = data.map(item => ({
        Produkt: item.product,
        Ilość: item.quantity,
        Minimalna: item.minQuantity || 0,
        Status: item.quantity <= item.minQuantity ? 'Brak' : 'OK',
        Zamówienie: item.quantity <= item.minQuantity ? `Zamówić ${item.minQuantity - item.quantity}` : ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    XLSX.writeFile(workbook, "inventory.xlsx");
});
