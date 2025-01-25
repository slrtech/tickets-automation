let loggedInUser;

function loginAndActivate() {
    document.getElementById("loading").style.display = "flex";
    let email = document.getElementById("email").value,
        password = document.getElementById("password").value;

    // Store credentials in sessionStorage after successful login
    const credentials = { email, password };

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    let requestBody = JSON.stringify({
        email: email,
        password: password,
        urlApi: "https://condfy.digisac.app/api/v1/"
    });

    fetch("https://app.integracao.cloud/webhook/getUser2", {
        method: "POST",
        headers: headers,
        body: requestBody,
        redirect: "follow"
    }).then(response => {
        if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);
        document.getElementById("loading").style.display = "none";
        return response.json();
    }).then(data => {
        loggedInUser = data;
        // Store credentials after successful login
        sessionStorage.setItem('userCredentials', JSON.stringify(credentials));

        // Fetch automations first
        fetch('https://app.integracao.cloud/webhook/messageDistribution/list', {
            headers: {
                'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
            },
        })
            .then(response => response.json())
            .then(automations => {
                // Now call displayRoles with both roles and automations
                displayRoles(data.roles, automations);

                // Hide login elements and show activation buttons
                document.getElementById("login").style.display = "none";
                document.getElementById("activationButtons").style.display = "block";
                document.getElementById("email").style.display = "none";
                document.getElementById("password").style.display = "none";

                // Add logged-in class to adjust spacing
                document.querySelector('.login-wrapper').classList.add('logged-in');

                // Hide the title text after login
                document.getElementById('pageTitle').style.display = "none";

                if (data.isAdmin) {
                    document.getElementById("adminDashboardButton").style.display = "block";
                }
            })
            .catch(error => {
                console.error('Error fetching automations:', error);
            });
    }).catch(error => {
        console.error("Error:", error.message);
        document.getElementById("loading").style.display = "none";
        showAlert({
            icon: "error",
            title: "Error...",
            text: "Senha incorreta, ou erro do servidor. Tente novamente."
        });
    });
}

function redirectToAdminDashboard() {
    window.location.href = `${window.location.origin}/tickets-automation/adminPage.html`;
}

function displayRoles(roles, automationsResponse) {
    let t = document.getElementById("rolesList");
    const selector1 = document.getElementById('selector1'); // Deactivation selector
    const selector2 = document.getElementById('selector2'); // Activation selector

    console.log("Roles from API response:", roles);

    t.style.display = "block";

    // Clear selectors before adding new options
    selector1.innerHTML = '';
    selector2.innerHTML = '';

    // Extract automations from the new response structure
    const automations = automationsResponse?.[0]?.automations || [];

    if (roles && roles.length > 0) {
        t.innerHTML = `
            <div class="roles-header">Distribuição está ativa para departamento(s):</div>
            <div class="roles-container">
                ${roles.map(role => `
                    <div class="role">
                        ${role.departmentName}
                    </div>
                `).join('')}
            </div>
        `;

        // Populate `selector1` with roles
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.roleId;
            option.textContent = role.departmentName;
            selector1.appendChild(option);
        });

        // Enable the deactivate button if there are active roles
        const deactivateBtn = document.querySelector('button[onclick="deactivateAccount()"]');
        if (deactivateBtn) {
            deactivateBtn.disabled = false;
            deactivateBtn.style.opacity = '1';
            deactivateBtn.style.cursor = 'pointer';
            deactivateBtn.removeAttribute('data-tooltip');
        }
    } else {
        t.innerHTML = `<div class="roles-empty">Nenhuma Distribuição ativa</div>`;

        // Add a disabled option to selector1
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhuma automação ativa";
        option.disabled = true;
        option.selected = true;
        selector1.appendChild(option);

        // Disable the deactivate button
        const deactivateBtn = document.querySelector('button[onclick="deactivateAccount()"]');
        if (deactivateBtn) {
            deactivateBtn.disabled = true;
            deactivateBtn.style.opacity = '0.5';
            deactivateBtn.style.cursor = 'not-allowed';
            deactivateBtn.setAttribute('data-tooltip', 'Nenhuma automação ativa');
        }
    }

    // Handle activation button based on automations
    const activateBtn = document.querySelector('button[onclick="activateAccount()"]');

    if (!automations || automations.length === 0) {
        if (activateBtn) {
            activateBtn.disabled = true;
            activateBtn.style.opacity = '0.5';
            activateBtn.style.cursor = 'not-allowed';
            activateBtn.setAttribute('data-tooltip', 'Nenhuma automação configurada');
        }

        // Add a disabled option to selector2
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhuma automação configurada";
        option.disabled = true;
        option.selected = true;
        selector2.appendChild(option);
    } else {
        // Enable the activate button if it was disabled
        if (activateBtn) {
            activateBtn.disabled = false;
            activateBtn.style.opacity = '1';
            activateBtn.style.cursor = 'pointer';
            activateBtn.removeAttribute('data-tooltip');
        }

        // Populate selector2 with available automations
        automations.forEach(automation => {
            const option = document.createElement('option');
            option.value = automation.settings.roleId;
            option.textContent = automation.settings.departmentName;
            selector2.appendChild(option);
        });
    }
}

function activateAccount() {
    if (loggedInUser) {
        openModal("departmentModal");
    } else {
        showAlert({
            icon: "error",
            title: "Oops...",
            text: "Please log in first!"
        });
    }
}

function deactivateAccount() {
    if (loggedInUser) {
        openModal("deactivateModal");
    } else {
        showAlert({
            icon: "error",
            title: "Oops...",
            text: "Please log in first!"
        });
    }
}

let customReason = ""; // Store the custom reason temporarily

function promptCustomReason() {
    openModal("customReasonModal"); // Open custom reason modal
    document.getElementById("customReasonInput").focus(); // Autofocus
}

function submitCustomReason() {
    const input = document.getElementById("customReasonInput").value.trim();
    if (input === "") {
        showAlert({
            icon: "warning",
            text: "Por favor, insira um motivo válido.",
        });
        return;
    }
    customReason = input; // Save the reason
    closeModal("customReasonModal"); // Close modal
    confirmDeactivationWithReason(customReason);
}

function confirmDeactivation() {
    const reason = document.getElementById("reason").value;
    if (reason === "Outros") {
        promptCustomReason(); // Show Apple-style input if "Outros" selected
    } else {
        confirmDeactivationWithReason(reason);
    }
}

function confirmDeactivationWithReason(reason) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const selectorElement = document.getElementById("selector1");
    const departmentName = selectorElement.options[selectorElement.selectedIndex].text;
    const selectedRoleId = selectorElement.value;

    // Show loading spinner
    document.getElementById("loading").style.display = "flex";

    const requestBody = JSON.stringify({
        user: loggedInUser,
        reason: reason,
        roleId: selectedRoleId,  // Use roleId instead of automationId
        departmentName: departmentName
    });

    fetch("https://app.integracao.cloud/webhook/deactivateUser2", {
        method: "POST",
        headers: headers,
        body: requestBody,
    })
        .then(response => {
            if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            loginAndActivate(); // Refresh UI
            document.getElementById("loading").style.display = "none";
            closeModal("deactivateModal");
            showAlert({
                title: "Desativação bem-sucedida!",
                text: data.status,
                icon: "success",
            });
        })
        .catch(error => {
            document.getElementById("loading").style.display = "none";
            console.error("Erro:", error.message);
            showAlert({
                icon: "error",
                title: "Erro...",
                text: "Erro ao desativar. Por favor, tente novamente.",
            });
        });
}

function confirmActivation() {
    let e = new Headers();
    e.append("Content-Type", "application/json");

    const selectorElement = document.getElementById("selector2");
    const selectedIndex = selectorElement.selectedIndex;
    const roleId = selectorElement.value; // This is now the roleId from settings
    const departmentName = selectorElement.options[selectedIndex].textContent;

    // Show loading spinner
    document.getElementById("loading").style.display = "flex";

    let t = JSON.stringify({
        user: loggedInUser,
        roleId: roleId,
        departmentName: departmentName
    });

    fetch("https://app.integracao.cloud/webhook/activateUser2", {
        method: "POST",
        headers: e,
        body: t,
        redirect: "follow"
    })
        .then(response => {
            if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            loginAndActivate(); // Refresh UI
            document.getElementById("loading").style.display = "none";
            closeModal("departmentModal");
            showAlert({
                title: "Ativação bem-sucedida!",
                text: data.status,
                icon: "success"
            });
        })
        .catch(error => {
            console.error("Error:", error.message);
            document.getElementById("loading").style.display = "none";
            showAlert({
                icon: "error",
                title: "Error...",
                text: "Unable to activate account. Please try again."
            });
        });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("hidden");
    modal.classList.add("active");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("active");
    modal.classList.add("hidden");
}

document.addEventListener("click", function (e) {
    const deactivateModal = document.getElementById("deactivateModal");
    const departmentModal = document.getElementById("departmentModal");
    if (e.target.classList.contains("modal")) {
        closeModal(deactivateModal.id);
        closeModal(departmentModal.id);
    }
});

function processAutomations(data) {
    const departmentArray = []; // Use an array to store all departments

    data.forEach((automation) => {
        const { departmentName, roleId } = automation.settings;

        // Add every department without checking for duplicates
        departmentArray.push([roleId, departmentName]);
    });

    populateSelectors(departmentArray); // Populate selectors with all departments
}

function populateSelectors(departmentArray) {
    const selector2 = document.getElementById('selector2'); // Activation selector

    // Clear existing options
    selector2.innerHTML = '';

    departmentArray.forEach(([roleId, departmentName]) => {
        const option2 = document.createElement('option');
        option2.value = roleId;  // Use roleId as the value for activation
        option2.textContent = departmentName;  // Show departmentName to the user
        selector2.appendChild(option2);
    });

    // Optionally store the map for activation lookups
    const roleToDepartmentMap = new Map(departmentArray.map(([roleId, departmentName]) => [roleId, departmentName]));
    window.roleToDepartmentMap = roleToDepartmentMap;
}

function showAlert(options) {
    return Swal.fire({
        position: 'center',
        heightAuto: false,
        customClass: {
            popup: 'custom-alert-popup',
            confirmButton: 'custom-alert-button',
            cancelButton: 'custom-alert-button'
        },
        confirmButtonColor: '#339989', // Your theme's primary green color
        ...options
    });
}

const loadingElement = document.getElementById("loading");
loadingElement.style.display = "none";

// Add this function to check for stored credentials on page load
function checkStoredCredentials() {
    const storedCredentials = sessionStorage.getItem('userCredentials');
    if (storedCredentials) {
        // Hide login form immediately before filling credentials
        document.getElementById("email").style.display = "none";
        document.getElementById("password").style.display = "none";
        document.getElementById("login").style.display = "none";
        document.getElementById('pageTitle').style.display = "none";

        // Fill credentials and login
        const { email, password } = JSON.parse(storedCredentials);
        document.getElementById("email").value = email;
        document.getElementById("password").value = password;
        loginAndActivate(); // Automatically login with stored credentials
    }
}

// Add this line at the end of the file
window.onload = checkStoredCredentials;
