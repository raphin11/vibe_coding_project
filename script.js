// DOM Elements
const balance = document.getElementById('balance');
const money_plus = document.getElementById('total-income');
const money_minus = document.getElementById('total-expense');
const list = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-btn');
const closeBtn = document.querySelector('.close-btn');
const themeToggle = document.getElementById('theme-toggle');

// State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart = null;
const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', `${isDark ? '라이트' : '다크'} 모드로 전환`);
    themeToggle.innerHTML = `
        <i class="fas fa-${isDark ? 'sun' : 'moon'}" aria-hidden="true"></i>
        <span>${isDark ? '라이트' : '다크'} 모드</span>
    `;
}

applyTheme(initialTheme);

// Functions
function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0);
    const expense = (amounts
        .filter(item => item < 0)
        .reduce((acc, item) => (acc += item), 0) * -1);

    balance.innerText = `₩ ${total.toLocaleString()}`;
    money_plus.innerText = `₩ ${income.toLocaleString()}`;
    money_minus.innerText = `₩ ${expense.toLocaleString()}`;
}

function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');
    item.classList.add('transaction-item');

    item.innerHTML = `
        <div class="transaction-info">
            <h4>${transaction.text}</h4>
            <span>${transaction.category}</span>
        </div>
        <div class="transaction-amount-wrapper">
            <span class="transaction-amount ${transaction.amount < 0 ? 'minus' : 'plus'}">
                ${sign}${Math.abs(transaction.amount).toLocaleString()}
            </span>
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    list.appendChild(item);
}

function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Group expenses by category
    const expenseData = transactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
            return acc;
        }, {});

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (myChart) {
        myChart.destroy();
    }

    if (labels.length === 0) {
        // Show empty state if no expenses
        return;
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4a90e2', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#34495e'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim()
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    init();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    updateChart();
}

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('내용과 금액을 입력해주세요');
        return;
    }

    const transaction = {
        id: Math.floor(Math.random() * 100000000),
        text: text.value,
        amount: +amount.value,
        category: category.value
    };

    transactions.push(transaction);
    addTransactionDOM(transaction);
    updateValues();
    updateChart();
    updateLocalStorage();

    text.value = '';
    amount.value = '';
    modal.style.display = 'none';
});

addBtn.onclick = () => modal.style.display = 'block';
closeBtn.onclick = () => modal.style.display = 'none';
themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateChart();
});
window.onclick = (e) => {
    if (e.target == modal) modal.style.display = 'none';
};

// Initial Call
init();

// Partnership Form (Formspree)
const partnershipForm = document.getElementById('partnership-form');
const contactSubmitBtn = document.getElementById('contact-submit-btn');
const contactStatusMessage = document.getElementById('contact-status-message');
const contactSuccessBox = document.getElementById('contact-success-box');
const btnResetContact = document.getElementById('btn-reset-contact');

if (partnershipForm) {
    partnershipForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!partnershipForm.checkValidity()) {
            partnershipForm.reportValidity();
            return;
        }

        contactSubmitBtn.disabled = true;
        contactSubmitBtn.innerHTML = `<span class="spinner"></span> <span>전송 중...</span>`;
        contactStatusMessage.style.display = 'none';

        const formData = new FormData(partnershipForm);

        try {
            const response = await fetch(partnershipForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                partnershipForm.reset();
                partnershipForm.style.display = 'none';
                contactSuccessBox.style.display = 'block';
            } else {
                const data = await response.json();
                let errMsg = '문의 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
                if (data && data.errors && data.errors.length > 0) {
                    errMsg = data.errors.map(err => err.message).join(', ');
                }
                showContactError(errMsg);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showContactError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
        } finally {
            contactSubmitBtn.disabled = false;
            contactSubmitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> <span>문의 보내기</span>`;
        }
    });

    function showContactError(msg) {
        contactStatusMessage.textContent = msg;
        contactStatusMessage.className = 'status-message error';
        contactStatusMessage.style.display = 'block';
        contactStatusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (btnResetContact) {
        btnResetContact.addEventListener('click', () => {
            contactSuccessBox.style.display = 'none';
            partnershipForm.style.display = 'block';
            contactStatusMessage.style.display = 'none';
        });
    }
}
