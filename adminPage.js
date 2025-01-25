let cronDisplayDescription = ''; // Human-readable cron description
let cronExpression = '';        // Raw cron expression

// Function to redirect to another HTML file
function redirectToLogin() {
  window.location.href = "${window.location.origin}/tickets-automation/index.html"; // Replace with the actual HTML file name
}
// Fetch automation data from API and populate the table
function fetchAutomations() {
  // Show the loading indicator
  document.getElementById("loading_general").style.display = "flex";

  fetch('https://app.integracao.cloud/webhook/messageDistribution/list', {
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
    },
  })
    .then(response => response.json())
    .then(data => {
      // Extract automations from the new response structure
      const automations = data?.[0]?.automations || [];

      // Sort the automations by createdAt in descending order (newest first)
      const sortedAutomations = automations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Hide the loading indicator
      document.getElementById("loading_general").style.display = "none";

      console.log(sortedAutomations); // Check the sorted data for debugging
      populateTable(sortedAutomations);
    })
    .catch(error => {
      // Hide the loading indicator
      document.getElementById("loading_general").style.display = "none";
      console.error('Error fetching automations:', error);
    });
}



// Populate the table with automation data
function populateTable(automations) {
  const tableContainer = document.querySelector('.table-container');

  // Clear existing content
  tableContainer.innerHTML = '';

  // Add scroll container
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'table-scroll';

  // Create table
  const table = document.createElement('table');
  const tableBody = document.createElement('tbody');
  tableBody.id = 'automation-list';

  // Add table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>Nome</th>
      <th>Status</th>
      <th>Cargo</th>
      <th>Departamento</th>
      <th>Limite por Depto</th>
      <th>Total de Chamados</th>
      <th>Status de Transferência</th>
      <th>Ações</th>
    </tr>
  `;

  table.appendChild(thead);
  table.appendChild(tableBody);
  scrollContainer.appendChild(table);
  tableContainer.appendChild(scrollContainer);

  automations.forEach(automation => {
    const row = document.createElement('tr');

    // Eye button (View settings)
    const viewSettingsCell = document.createElement('td');
    const viewButton = document.createElement('button');
    viewButton.classList.add('action-btn');
    viewButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    `;
    viewButton.onclick = () => viewSettings(automation);
    viewSettingsCell.appendChild(viewButton);
    row.appendChild(viewSettingsCell);

    // Automation Name
    const nameCell = document.createElement('td');
    nameCell.textContent = automation.name;
    row.appendChild(nameCell);

    row.dataset.automationId = automation.id;

    // Status with badge
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.classList.add('status-badge', automation.active === 'true' ? 'active' : 'inactive');
    statusBadge.innerHTML = `
      <span class="status-dot"></span>
      ${automation.active === 'true' ? 'Ativo' : 'Inativo'}
    `;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    // Cargo
    const roleCell = document.createElement('td');
    roleCell.textContent = automation.settings?.roleName || 'N/A';
    row.appendChild(roleCell);

    // Departamento
    const departmentCell = document.createElement('td');
    departmentCell.textContent = automation.settings?.departmentName || 'N/A';
    row.appendChild(departmentCell);

    // Limite por departamento
    const isLimitByDepartment = document.createElement('td');
    isLimitByDepartment.innerHTML = automation.settings?.ticketByDepartment ?
      '<span style="color: #34C759">✓</span>' :
      '<span style="color: #FF3B30">×</span>';
    row.appendChild(isLimitByDepartment);

    // Quantidade de chamados
    const totalTickets = document.createElement('td');
    totalTickets.textContent = automation.settings?.totalTickets || '0';
    row.appendChild(totalTickets);

    // User Status Condition
    const userStatusCell = document.createElement('td');
    const statusList = automation.settings?.transferStatuses || [];
    if (statusList.includes('all')) {
      userStatusCell.innerHTML = '<span class="status-badge" style="background: rgba(0, 122, 255, 0.1); color: #007AFF;">Todos</span>';
    } else {
      userStatusCell.innerHTML = statusList
        .map(status => {
          const colors = {
            online: '#34C759',
            offline: '#FF3B30',
            away: '#FF9500'
          };
          return `<span class="status-badge" style="background: rgba(${status === 'online' ? '52, 199, 89' : status === 'offline' ? '255, 59, 48' : '255, 149, 0'}, 0.1); color: ${colors[status]}">${status === 'online' ? 'Online' :
            status === 'offline' ? 'Offline' :
              'Ausente'
            }</span>`;
        })
        .join(' ');
    }
    row.appendChild(userStatusCell);

    // Actions with new styling
    const actionCell = document.createElement('td');
    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');

    // Toggle button
    const toggleButton = document.createElement('button');
    toggleButton.classList.add('action-btn', automation.active === 'true' ? 'deactivate' : 'activate');
    toggleButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
        <line x1="12" y1="2" x2="12" y2="12"/>
      </svg>
    `;
    toggleButton.onclick = () => {
      automation.active === 'true' ? deactivateAutomation(automation.id) : activateAutomation(automation.id);
    };

    // Edit button
    const editButton = document.createElement('button');
    editButton.classList.add('action-btn', 'edit');
    editButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    `;
    editButton.onclick = () => openUpdateModal(automation);

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('action-btn', 'delete');
    deleteButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 6h18"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    deleteButton.onclick = () => confirmDelete(automation.id, automation.name);

    actionButtons.appendChild(toggleButton);
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);
    actionCell.appendChild(actionButtons);
    row.appendChild(actionCell);

    // Append row to table
    tableBody.appendChild(row);
  });
}


// Function to display settings
function viewSettings(settings) {
  if (settings) {
    // Convert the createdAt timestamp to Brazilian format
    const createdAt = settings.createdAt
      ? new Date(settings.createdAt).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      : 'Data indisponível';

    // Handle user statuses for display
    const statusList = settings.settings.transferStatuses || [];
    const formattedStatuses = statusList.includes('all')
      ? '<span style="color: #007bff; font-weight: bold;">Todos</span>'
      : statusList
        .map(status => {
          switch (status) {
            case 'online':
              return '<span style="color: #28a745;">Online</span>';
            case 'offline':
              return '<span style="color: #dc3545;">Offline</span>';
            case 'away':
              return '<span style="color: #ffc107;">Ausente</span>';
            default:
              return status;
          }
        })
        .join(' ');

    // Build the modal content with new styling
    const modalContent = `
      <div class="info-item">
        <div class="info-label">Atualizado em</div>
        <div class="info-value">${createdAt}</div>
      </div>
      <div class="info-item">
        <div class="info-label">ID</div>
        <div class="info-value">${settings.settings.id}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Nome</div>
        <div class="info-value">${settings.settings.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Departamento</div>
        <div class="info-value">${settings.settings.departmentName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Cargo</div>
        <div class="info-value">${settings.settings.roleName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Limite de Chamados</div>
        <div class="info-value">${settings.settings.totalTickets}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Limite por Departamento</div>
        <div class="info-value">${settings.settings.ticketByDepartment ? 'Sim' : 'Não'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Mensagem</div>
        <div class="info-value">${settings.settings.message || 'Não configurada'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status para transferência</div>
        <div class="info-value">${formattedStatuses}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Frequência</div>
        <div class="info-value">${settings.settings.cronDescription || 'Não configurado'}</div>
      </div>
    `;

    // Populate and show the modal
    document.getElementById('workflowInfoDetails').innerHTML = modalContent;
    document.getElementById('workflowInfoModal').style.display = 'flex';
  }
}


function closeWorkflowInfoModal() {
  document.getElementById('workflowInfoModal').style.display = 'none';
}



// Toggle status between Active and Inactive
function toggleStatus(button, automationId) {
  // Call the appropriate function based on the current status
  if (button.textContent === 'Deactivate') {
    deactivateAutomation(automationId);
  } else {
    activateAutomation(automationId);
  }
}

// Activate automation
function activateAutomation(automationId) {
  const url = `https://app.integracao.cloud/webhook/messageDistribution/activate`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: automationId })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data); // Check the activated data for debugging
      fetchAutomations(); // Refresh table after activation
    })
    .catch(error => console.error('Error activating automation:', error));
}

// Deactivate automation
function deactivateAutomation(automationId) {
  const url = `https://app.integracao.cloud/webhook/messageDistribution/deactivate`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: automationId })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data); // Check the deactivated data for debugging
      fetchAutomations(); // Refresh table after deactivation
    })
    .catch(error => console.error('Error deactivating automation:', error));
}

// Confirm delete
function confirmDelete(automationId, automationName) {
  Swal.fire({
    icon: "warning",
    title: "Confirmação de Exclusão",
    text: `Você tem certeza que deseja excluir a automação "${automationName}"?`,
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  }).then((result) => {
    if (result.isConfirmed) {
      deleteAutomation(automationId, automationName); // Proceed with deletion
      Swal.fire(
        "Excluído!",
        "A automação foi excluída com sucesso.",
        "success"
      );
    }
  });
}

// Delete automation
function deleteAutomation(automationId, automationName) {
  const url = `https://app.integracao.cloud/webhook/messageDistribution/delete`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: automationId, name: automationName })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data); // Check the activated data for debugging
      fetchAutomations(); // Refresh table after activation
    })
    .catch(error => console.error('Erro ao deletar distribuiçao:', error));
}

// cron selector
// Function to generate the cron expression
function generateCronExpression() {
  const minutes = document.getElementById('cronMinutes').value || '*';
  const startHour = document.getElementById('cronStartHour').value;
  const endHour = document.getElementById('cronEndHour').value;
  const dayOfMonth = document.getElementById('cronDayOfMonth').value || '*';
  const month = document.getElementById('cronMonth').value || '*';
  const dayOfWeekCheckboxes = [
    document.getElementById('cronMonday'),
    document.getElementById('cronTuesday'),
    document.getElementById('cronWednesday'),
    document.getElementById('cronThursday'),
    document.getElementById('cronFriday'),
    document.getElementById('cronSaturday'),
    document.getElementById('cronSunday')
  ];

  // Check if at least one weekday is selected
  const isAnyWeekdaySelected = dayOfWeekCheckboxes.some(checkbox => checkbox.checked);
  if (!isAnyWeekdaySelected) {
    showPopup("Selecione pelo menos um dia.");
    return;
  }

  // Check if both start and end hours are provided
  if (!startHour || !endHour) {
    showPopup("Selecione horários.");
    return;
  }

  // Validate that end hour is greater than start hour
  if (parseInt(endHour) <= parseInt(startHour)) {
    showPopup("A hora final deve ser maior que a hora inicial.");
    return;
  }

  // Adjust end hour (subtract 1)
  const adjustedEndHour = parseInt(endHour) - 1;

  // Create the weekday part of the cron expression
  const selectedDays = dayOfWeekCheckboxes
    .map((checkbox, index) => checkbox.checked ? index : null)
    .filter(day => day !== null)
    .join(',');

  // Combine the values into a cron expression with adjusted end hour
  const cronExpression = `${minutes} ${startHour}-${adjustedEndHour} ${dayOfMonth} ${month} ${selectedDays}`;
  console.log('Generated Cron Expression:', cronExpression);

  return cronExpression;
}

function openCronModal() {
  const cronInput = document.getElementById('cronInput');
  const container = document.getElementById('cronRulesContainer');

  // Clear any existing rules if there's no value in cronInput
  if (!cronInput.value) {
    container.innerHTML = '';
  }

  document.getElementById('cronModal').classList.add('active');
}

function closeCronModal() {
  document.getElementById('cronModal').classList.remove('active');
}

// Add cron rules and generate cron expression

let cronRules = []; // Array to store cron rules

// Function to add a cron rule
function addCronRule() {
  const container = document.getElementById('cronRulesContainer');

  // Check if a rule already exists
  if (container.children.length > 0) {
    showPopup("Apenas um período pode ser configurado. Remova o período existente para adicionar um novo.");
    return;
  }

  const selectedDays = [];
  if (document.getElementById('cronMonday').checked) selectedDays.push('1');
  if (document.getElementById('cronTuesday').checked) selectedDays.push('2');
  if (document.getElementById('cronWednesday').checked) selectedDays.push('3');
  if (document.getElementById('cronThursday').checked) selectedDays.push('4');
  if (document.getElementById('cronFriday').checked) selectedDays.push('5');
  if (document.getElementById('cronSaturday').checked) selectedDays.push('6');
  if (document.getElementById('cronSunday').checked) selectedDays.push('0');

  const startHour = document.getElementById('cronStartHour').value;
  const endHour = document.getElementById('cronEndHour').value;

  // Validation: At least one weekday must be selected
  if (selectedDays.length === 0) {
    showPopup("Selecione pelo menos um dia.");
    return;
  }

  // Validation: Both start and end hours are required and must be integers
  if (!startHour || !endHour || !/^\d+$/.test(startHour) || !/^\d+$/.test(endHour)) {
    showPopup("Preencha início e término com valores inteiros.");
    return;
  }

  // Validate that end hour is greater than start hour
  if (parseInt(endHour) <= parseInt(startHour)) {
    showPopup("A hora final deve ser maior que a hora inicial.");
    return;
  }

  // Map days to PT-BR abbreviations
  const dayMap = {
    '1': 'Seg',
    '2': 'Ter',
    '3': 'Qua',
    '4': 'Qui',
    '5': 'Sex',
    '6': 'Sáb',
    '0': 'Dom'
  };

  // Format days and hours for the rule description (show original end hour in UI)
  const formattedDays = selectedDays.map(day => dayMap[day]).join(', ');
  const ruleText = `${formattedDays} | ${startHour}:00 até ${endHour}:00`;

  // Create new rule item
  const ruleItem = document.createElement('div');
  ruleItem.className = 'cron-rule-item selected';
  ruleItem.innerHTML = `
    <span class="cron-rule-text">${ruleText}</span>
    <button class="cron-rule-remove" onclick="removeCronRule(this)">×</button>
  `;

  // Store the rule data (store adjusted end hour)
  ruleItem.dataset.days = selectedDays.join(',');
  ruleItem.dataset.startHour = startHour;
  ruleItem.dataset.endHour = (parseInt(endHour) - 1).toString(); // Store adjusted end hour

  container.appendChild(ruleItem);

  // Clear inputs and checkboxes
  document.getElementById('cronStartHour').value = '';
  document.getElementById('cronEndHour').value = '';
  selectedDays.forEach(day => {
    document.getElementById(`cron${getDayName(day)}`).checked = false;
  });
}

// Helper function to get day name from number
function getDayName(day) {
  const dayNames = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };
  return dayNames[day];
}

function removeCronRule(button) {
  button.closest('.cron-rule-item').remove();
}

// Function to generate cron
function generateCron() {
  const container = document.getElementById('cronRulesContainer');
  const selectedRule = container.querySelector('.cron-rule-item.selected');

  if (!selectedRule) {
    showPopup('Selecione um período.');
    return;
  }

  // Get data from the selected rule
  const days = selectedRule.dataset.days;
  const startHour = selectedRule.dataset.startHour;
  const endHour = selectedRule.dataset.endHour;
  const displayEndHour = parseInt(endHour) + 1; // Convert back to display hour

  // Map days to PT-BR abbreviations
  const dayMap = {
    '1': 'Seg',
    '2': 'Ter',
    '3': 'Qua',
    '4': 'Qui',
    '5': 'Sex',
    '6': 'Sáb',
    '0': 'Dom'
  };

  // Format description with original end hour for display
  const formattedDays = days.split(',').map(day => dayMap[day]).join(', ');
  cronDisplayDescription = `Dias: ${formattedDays} | ${startHour}:00 até ${displayEndHour}:00`;

  // Generate cron expression with adjusted end hour for backend
  cronExpression = `* ${startHour}-${endHour} * * ${days}`;

  // Display description in the input field
  document.getElementById('cronInput').value = cronDisplayDescription;

  closeCronModal();
}

// Function to fetch departments
function fetchDepartments(dropdownId, selectedValue = '') {
  fetch('https://app.integracao.cloud/webhook/messageDistribution/departments', {
    method: 'GET',
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      populateDepartmentDropdown(data, dropdownId, selectedValue);
    })
    .catch(error => console.error('Error fetching departments:', error));
}

// Populate the dropdown with fetched departments
function populateDepartmentDropdown(departments, dropdownId = 'departmentDropdown', selectedValue = '') {
  const departmentDropdown = document.getElementById(dropdownId);

  // Clear existing options except the default one
  departmentDropdown.innerHTML = '<option value="">Selecione o departamento</option>';

  // Populate dropdown with department data
  departments.forEach(department => {
    const option = document.createElement('option');
    option.value = department.id; // Use department ID as value
    option.textContent = department.name; // Display department name

    // Preselect the department if it matches the selectedValue
    if (department.id === selectedValue) {
      option.selected = true;
    }

    departmentDropdown.appendChild(option);
  });
}



// Function to fetch departments
function fetchRoles(dropdownId, selectedValue = '') {
  fetch('https://app.integracao.cloud/webhook/messageDistribution/roles', {
    method: 'GET',
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      populateRolesDropdown(data, dropdownId, selectedValue);
    })
    .catch(error => console.error('Error fetching roles:', error));
}


// Populate the dropdown with fetched departments
function populateRolesDropdown(roles, dropdownId = 'roleDropdown', selectedValue = '') {
  const roleDropdown = document.getElementById(dropdownId);

  // Clear existing options except the default one
  roleDropdown.innerHTML = '<option value="">Selecione o cargo</option>';

  // Populate dropdown with role data
  roles.forEach(role => {
    const option = document.createElement('option');
    option.value = role.id; // Use role ID as value
    option.textContent = role.displayName; // Display role name

    // Preselect the role if it matches the selectedValue
    if (role.id === selectedValue) {
      option.selected = true;
    }

    roleDropdown.appendChild(option);
  });
}


function handleTransferStatusSelection(containerId) {
  const isUpdateModal = containerId === 'updateTransferStatus';
  const prefix = isUpdateModal ? 'update' : '';

  const allCheckbox = document.querySelector(`#${prefix}${isUpdateModal ? 'All' : 'all'}`);
  const otherCheckboxes = Array.from(
    document.querySelectorAll(`#${containerId} input[type="checkbox"]:not([value="all"])`)
  );

  // Remove existing listeners to avoid duplicates
  const newAllCheckbox = allCheckbox.cloneNode(true);
  const newOtherCheckboxes = otherCheckboxes.map(checkbox => checkbox.cloneNode(true));

  allCheckbox.replaceWith(newAllCheckbox);
  otherCheckboxes.forEach((checkbox, i) => checkbox.replaceWith(newOtherCheckboxes[i]));

  // Add fresh listeners
  newAllCheckbox.addEventListener('change', () => {
    if (newAllCheckbox.checked) {
      newOtherCheckboxes.forEach(checkbox => (checkbox.checked = false));
    }
  });

  newOtherCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const allSelected = newOtherCheckboxes.every(checkbox => checkbox.checked);

      if (allSelected) {
        newAllCheckbox.checked = true;
        newOtherCheckboxes.forEach(box => (box.checked = false));
      } else {
        newAllCheckbox.checked = false;
      }
    });
  });
}




// Call the function when the modal is opened
function openModal() {
  document.getElementById('createModal').style.display = 'flex';
  fetchDepartments('departmentDropdown'); // Fetch departments when the modal opens
  fetchRoles('roleDropdown'); // Fetch roles when the modal opens

  // Reset checkboxes to default state: only "Online" selected
  const allCheckbox = document.querySelector('#transferStatus input[value="all"]');
  const otherCheckboxes = Array.from(document.querySelectorAll('#transferStatus input[type="checkbox"]:not([value="all"])'));
  const onlineCheckbox = document.querySelector('#transferStatus input[value="online"]');

  // Clear all selections
  allCheckbox.checked = false;
  otherCheckboxes.forEach(checkbox => checkbox.checked = false);

  // Select only "Online"
  onlineCheckbox.checked = true;

  // Initialize checkbox behavior
  handleTransferStatusSelection('transferStatus');
}




function closeModal() {
  document.getElementById('createModal').style.display = 'none';
}


function clearAutomationForm() {
  document.getElementById('automationName').value = '';
  document.getElementById('cronInput').value = '';
  document.getElementById('departmentDropdown').value = '';
  document.getElementById('roleDropdown').value = '';
  document.getElementById('ticketByDepartment').checked = false;
  document.getElementById('totalTickets').value = '';
  document.getElementById('message').value = '';

  // Clear the status checkboxes
  document.querySelectorAll('#statusTransfer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
}


// Function to save new automation with duplicate prevention
function saveAutomation() {
  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(msg => msg.remove());
  const fields = ['automationName', 'cronInput', 'departmentDropdown', 'roleDropdown', 'totalTickets', 'transferStatus', 'message'];
  fields.forEach(field => {
    document.getElementById(field).style.borderColor = ''; // Reset field border
  });

  // Validation variables
  // Gather field values
  const name = document.getElementById('automationName').value.trim();
  const cronDescription = cronDisplayDescription; // User-friendly cron text
  const cron = cronExpression; // Raw cron expression
  const departmentId = document.getElementById('departmentDropdown').value;
  const departmentName = document.getElementById('departmentDropdown').selectedOptions[0]?.text || '';
  const roleId = document.getElementById('roleDropdown').value;
  const roleName = document.getElementById('roleDropdown').selectedOptions[0]?.text || '';
  const ticketByDepartment = document.getElementById('ticketByDepartment').checked;
  const totalTickets = document.getElementById('totalTickets').value.trim();
  // Get the message input from the form
  const message = document.getElementById('message').value.trim();

  // Collect selected statuses
  const statusElements = document.querySelectorAll('#transferStatus input[type="checkbox"]:checked');
  let transferStatuses = Array.from(statusElements).map(input => input.value);

  // Check for duplicate names before proceeding
  const tableRows = document.querySelectorAll('#automation-list tr');
  const isDuplicate = Array.from(tableRows).some(row => {
    const existingName = row.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
    return existingName.toLowerCase() === name.toLowerCase();
  });
  const isDuplicateDepartment = Array.from(tableRows).some(row => {
    const existingNameDepartment = row.querySelector('td:nth-child(5)')?.textContent?.trim() || '';
    return existingNameDepartment.toLowerCase() === departmentName.toLowerCase();
  });

  // Validations
  let errors = [];
  // Validation checks
  if (isDuplicate) {
    showError('automationName', `Uma automação com o nome "${name}" já existe.`);
    errors.push('Nome duplicado.');
  }
  if (isDuplicateDepartment) {
    showError('departmentDropdown', `Já existe uma automação configurada para o departamento "${departmentName}".`);
    errors.push('Departamento duplicado.');
  }
  if (!name) {
    showError('automationName', 'Por favor, insira um nome para a automação.');
    errors.push('Nome inválido.');
  }
  if (!cronDescription) {
    showError('cronInput', 'Por favor, configure o cron.');
    errors.push('Cron inválido.');
  }
  if (!departmentId) {
    showError('departmentDropdown', 'Por favor, selecione um departamento.');
    errors.push('Departamento inválido.');
  }
  if (!roleId) {
    showError('roleDropdown', 'Por favor, selecione um cargo.');
    errors.push('Cargo inválido.');
  }
  if (!/^\d+$/.test(totalTickets)) {
    showError('totalTickets', 'Por favor, insira um número inteiro.');
    errors.push('Quantidade de chamados inválida.');
  }

  if (transferStatuses.length === 0) {
    // Error if no statuses are selected
    showError('transferStatus', 'Por favor, selecione pelo menos um status apto para transferência.');
    errors.push('Nenhum status selecionado.');
  }
  if (message.includes('"')) {
    showError('message', 'Não é permitido usar aspas duplas, use aspas simples.');
    errors.push('Mensagem inválida.');
  }

  // Display popup showPopup if errors are found
  if (errors.length > 0) {
    showPopup('Existem erros no formulário. Por favor, corrija-os e tente novamente.');
    return;
  }

  // Proceed with form submission if no errors
  console.log('Form is valid. Proceeding...');

  // Stop execution on errors
  if (errors.length > 0) {
    document.getElementById("loading").style.display = "none"; // Hide loading on validation errors
    submitButton.disabled = false; // Re-enable button if validation fails
    return;
  }

  document.getElementById("loading").style.display = "flex";
  closeModal()
  // Prepare payload
  const automationData = {
    name,
    cron, // Raw cron expression
    cronDescription, // User-friendly cron text
    departmentId,
    departmentName,
    roleId,
    roleName,
    ticketByDepartment,
    totalTickets: parseInt(totalTickets, 10),
    message,
    transferStatuses
  };

  // API Request
  fetch('https://app.integracao.cloud/webhook/messageDistribution/create', {
    method: 'POST',
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(automationData)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Erro desconhecido.');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Distribuição criada:', data);
      closeModal();
      fetchAutomations(); // Refresh the list
      clearAutomationForm();
    })
    .catch(error => {
      console.error('Erro ao criar a automação:', error);
      showPopup(`Erro ao criar automação: ${error.message}`);
    })
    .finally(() => {
      document.getElementById("loading").style.display = "none"; // Hide loading after completion
      submitButton.disabled = false; // Re-enable button
    });
}

// Show field-specific error message
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  field.style.borderColor = '#dc3545'; // Highlight field with red border
  field.parentNode.appendChild(errorElement);
}

// Show top-right popup showPopup
function showPopup(message) {
  // Remove any existing popup
  const existingPopup = document.querySelector('.alert-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create new popup
  const popup = document.createElement('div');
  popup.className = 'alert-popup';
  popup.textContent = message;
  document.body.appendChild(popup);

  // Trigger animation
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);

  // Remove popup after 5 seconds
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300); // Wait for animation to complete
  }, 5000);
}

function openUpdateModal(automation) {
  clearUpdateAutomationForm();
  const updateModal = document.getElementById('updateModal');
  updateModal.style.display = 'flex';

  // Fetch departments and roles with preselected values
  fetchDepartments('updateDepartmentDropdown', automation.settings.departmentId);
  fetchRoles('updateRoleDropdown', automation.settings.roleId);

  // Populate other fields with automation data
  document.getElementById('updateAutomationName').value = automation.name;
  document.getElementById('updateCronInput').value = automation.settings.cronDescription; // Read-only field
  document.getElementById('updateTicketByDepartment').checked = automation.settings.ticketByDepartment;
  document.getElementById('updateTotalTickets').value = automation.settings.totalTickets;
  document.getElementById('updateMessage').value = automation.settings.message;

  // Reset checkboxes for transfer statuses
  const allCheckbox = document.querySelector('#updateAll');
  const otherCheckboxes = Array.from(document.querySelectorAll('#updateTransferStatus input[type="checkbox"]:not([value="all"])'));

  // Clear all selections
  allCheckbox.checked = false;
  otherCheckboxes.forEach(checkbox => (checkbox.checked = false));

  // Preselect statuses based on the automation data
  if (automation.settings.transferStatuses.includes('all')) {
    allCheckbox.checked = true;
  } else {
    automation.settings.transferStatuses.forEach(status => {
      const checkbox = document.querySelector(`#update${status.charAt(0).toUpperCase() + status.slice(1)}`);
      if (checkbox) checkbox.checked = true;
    });
  }

  // Initialize checkbox behavior for "Todos" and other statuses
  handleTransferStatusSelection('updateTransferStatus');

  originalAutomationData = automation.settings

  cronExpression = automation.settings.cron || ''; // Use the existing cron value from the automation

  // Store the automation ID in the modal for the update function
  updateModal.dataset.automationId = automation.id;
}

function closeUpdateModal() {
  clearUpdateAutomationForm(); // Clear the form
  document.getElementById('updateModal').style.display = 'none';
}

function updateAutomation() {
  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(msg => msg.remove());
  const fields = ['updateAutomationName', 'updateDepartmentDropdown', 'updateRoleDropdown', 'updateTotalTickets', 'updateTransferStatus', 'updateMessage'];
  fields.forEach(field => {
    document.getElementById(field).style.borderColor = ''; // Reset field border
  });

  // Validation variables
  // Gather field values
  const automationId = document.getElementById('updateModal').dataset.automationId; // Get automation ID
  const name = document.getElementById('updateAutomationName').value.trim();
  const cronDescription = document.getElementById('updateCronInput').value.trim(); // Read-only cron description
  // Include the raw cron expression (make sure cronExpression is defined)
  const cron = cronExpression; // Raw cron expression
  const departmentId = document.getElementById('updateDepartmentDropdown').value;
  const departmentName = document.getElementById('updateDepartmentDropdown').selectedOptions[0]?.text || '';
  const roleId = document.getElementById('updateRoleDropdown').value;
  const roleName = document.getElementById('updateRoleDropdown').selectedOptions[0]?.text || '';
  const ticketByDepartment = document.getElementById('updateTicketByDepartment').checked;
  const totalTickets = document.getElementById('updateTotalTickets').value.trim();
  const message = document.getElementById('updateMessage').value.trim();

  // Collect selected statuses
  const statusElements = document.querySelectorAll('#updateTransferStatus input[type="checkbox"]:checked');
  let transferStatuses = Array.from(statusElements).map(input => input.value);

  // Retrieve original automation data from modal (assume it's stored as JSON)

  // Check for changes
  const hasChanges =
    name !== originalAutomationData.name ||
    cron !== originalAutomationData.cron ||
    departmentId !== originalAutomationData.departmentId ||
    roleId !== originalAutomationData.roleId ||
    ticketByDepartment !== originalAutomationData.ticketByDepartment ||
    totalTickets !== originalAutomationData.totalTickets.toString() ||
    message !== originalAutomationData.message ||
    JSON.stringify(transferStatuses) !== JSON.stringify(originalAutomationData.transferStatuses);

  // Check for duplicate names before proceeding
  const tableRows = document.querySelectorAll('#automation-list tr');

  const isDuplicate = Array.from(tableRows).some(row => {
    const existingName = row.querySelector('td:nth-child(2)')?.textContent?.trim() || '';  // Update if name is in the first column
    const existingId = row.dataset.automationId;  // Access hidden automation ID
    console.log(`Checking row: ID=${existingId}, Name=${existingName}`); // Debug log

    // Compare names, but skip if the same automation ID
    return existingName.toLowerCase() === name.toLowerCase() && existingId !== automationId;
  });

  const isDuplicateDepartment = Array.from(tableRows).some(row => {
    const existingDepartmentName = row.querySelector('td:nth-child(5)')?.textContent?.trim() || ''; // Department column
    const existingId = row.dataset.automationId;  // Access automation ID
    return existingDepartmentName.toLowerCase() === departmentName.toLowerCase() && existingId !== automationId; // Skip same ID
  });


  // Validations
  let errors = [];

  if (isDuplicate) {
    showError('updateAutomationName', `Uma automação com o nome "${name}" já existe.`);
    errors.push('Nome duplicado.');
  }
  if (isDuplicateDepartment) {
    showError('updateDepartmentDropdown', `Já existe uma automação configurada para o departamento "${departmentName}".`);
    errors.push('Departamento duplicado.');
  }
  // If no changes, exit the function
  if (!hasChanges) {
    showPopup('Nenhuma alteração foi feita. Atualização não necessária.');
    return;
  }
  if (!name) {
    showError('updateAutomationName', 'Por favor, insira um nome para a automação.');
    errors.push('Nome inválido.');
  }
  if (!cronDescription) {
    showError('updateCronInput', 'Por favor, configure o cron.');
    errors.push('Cron inválido.');
  }
  if (!departmentId) {
    showError('updateDepartmentDropdown', 'Por favor, selecione um departamento.');
    errors.push('Departamento inválido.');
  }
  if (!roleId) {
    showError('updateRoleDropdown', 'Por favor, selecione um cargo.');
    errors.push('Cargo inválido.');
  }
  if (!/^\d+$/.test(totalTickets)) {
    showError('updateTotalTickets', 'Por favor, insira um número inteiro.');
    errors.push('Quantidade de chamados inválida.');
  }

  if (transferStatuses.length === 0) {
    // Error if no statuses are selected
    showError('updateTransferStatus', 'Por favor, selecione pelo menos um status apto para transferência.');
    errors.push('Nenhum status selecionado.');
  }
  if (message.includes('"')) {
    showError('updateMessage', 'Não é permitido usar aspas duplas, use aspas simples.');
    errors.push('Mensagem inválida.');
  }

  // Display popup if errors are found
  if (errors.length > 0) {
    showPopup('Existem erros no formulário. Por favor, corrija-os e tente novamente.');
    return;
  }

  document.getElementById("loading_update").style.display = "flex"; // Show the loading spinner
  closeUpdateModal()
  // Prepare payload
  const automationData = {
    id: automationId, // Include the automation ID
    name,
    cron,
    cronDescription, // User-friendly cron text
    departmentId,
    departmentName,
    roleId,
    roleName,
    ticketByDepartment,
    totalTickets: parseInt(totalTickets, 10),
    message,
    transferStatuses,
  };

  // API Request
  fetch('https://app.integracao.cloud/webhook/messageDistribution/update', {
    method: 'PUT', // Update requires PUT
    headers: {
      'Message-Distribution-Token': '035e1551ff2bc4d1ef674d78e126eed4ab26b043',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(automationData),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Erro desconhecido.');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Automação atualizada:', data);
      closeUpdateModal(); // Close the update modal
      fetchAutomations(); // Refresh the list
    })
    .catch(error => {
      console.error('Erro ao atualizar a automação:', error);
      showPopup(`Erro ao atualizar automação: ${error.message}`);
    })
    .finally(() => {
      document.getElementById("loading_update").style.display = "none"; // Hide the loading spinner
    });
}

function clearUpdateAutomationForm() {
  // Reset text fields
  document.getElementById('updateAutomationName').value = '';
  document.getElementById('updateCronInput').value = '';
  document.getElementById('updateTotalTickets').value = '';
  document.getElementById('updateMessage').value = '';

  // Reset dropdowns
  document.getElementById('updateDepartmentDropdown').value = '';
  document.getElementById('updateRoleDropdown').value = '';

  // Reset checkboxes
  document.getElementById('updateTicketByDepartment').checked = false;

  // Clear transfer status checkboxes
  const allCheckbox = document.querySelector('#updateAll');
  const otherCheckboxes = Array.from(document.querySelectorAll('#updateTransferStatus input[type="checkbox"]:not([value="all"])'));

  allCheckbox.checked = false;
  otherCheckboxes.forEach(checkbox => checkbox.checked = false);

  // Reset modal dataset
  document.getElementById('updateModal').dataset.originalAutomation = '';
  document.getElementById('updateModal').dataset.automationId = '';

  console.log("Update automation form cleared.");
}

function openMotivosModal() {
  document.getElementById('motivosModal').style.display = 'flex';
  loadGeneralMotivos(); // Load general motivos
}

function closeMotivosModal() {
  document.getElementById('motivosModal').style.display = 'none';
  document.getElementById('motivoInput').value = ''; // Clear input field
  document.getElementById('motivosList').innerHTML = ''; // Clear list
}

function loadGeneralMotivos() {
  const savedMotivos = localStorage.getItem('general_motivos');
  const motivosList = document.getElementById('motivosList');
  motivosList.innerHTML = ''; // Clear previous list

  if (savedMotivos) {
    JSON.parse(savedMotivos).forEach(motivo => {
      const listItem = document.createElement('li');
      listItem.textContent = motivo;

      // Add remove button
      const removeBtn = document.createElement('span');
      removeBtn.textContent = '❌';
      removeBtn.classList.add('motivo-remove-btn');
      removeBtn.onclick = () => listItem.remove(); // Remove motivo
      listItem.appendChild(removeBtn);
      motivosList.appendChild(listItem);
    });
  }
}

function saveMotivos() {
  const motivosListItems = document.querySelectorAll('#motivosList li');
  const motivos = Array.from(motivosListItems).map(item => item.firstChild.textContent);

  // Save general motivos
  localStorage.setItem('general_motivos', JSON.stringify(motivos));

  alert('Motivos salvos com sucesso!');
  closeMotivosModal();
}


const cronInput = document.getElementById('updateCronInput');
const cronError = document.getElementById('cronError');

// Remove the existing event listener
cronInput.removeEventListener('mouseenter', () => { });

// Load automations when the page loads
window.onload = fetchAutomations;
document.getElementById("loading").style.display = "none";
document.getElementById("loading_general").style.display = "none";
document.getElementById("loading_update").style.display = "none";

// Add click event listeners to all modals for outside clicks
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    // Check if the click was on the modal backdrop (not the modal content)
    if (e.target === modal) {
      // Close the specific modal that was clicked
      if (modal.id === 'createModal') {
        closeModal();
      } else if (modal.id === 'updateModal') {
        closeUpdateModal();
      } else if (modal.id === 'cronModal') {
        closeCronModal();
      } else if (modal.id === 'workflowInfoModal') {
        closeWorkflowInfoModal();
      } else if (modal.id === 'motivosModal') {
        closeMotivosModal();
      }
    }
  });
});

// Add event listeners for toggle switches
document.querySelectorAll('#ticketByDepartment, #updateTicketByDepartment').forEach(toggle => {
  toggle.addEventListener('change', function () {
    const statusText = this.closest('.toggle-container').querySelector('.toggle-status');
    statusText.textContent = this.checked ? 'Sim' : 'Não';
  });
});

// Add these functions to handle the info sheet
const infoTexts = {
  'department-info': 'Chamados nesse departamento serão distribuídos automaticamente.',
  'role-info': 'Usuários com esse cargo receberão chamados transferidos pela automação.',
  'tickets-info': 'Quando o usuário chegar no limite de chamados configurados nesse campo, irá parar de receber transferências.',
  'limit-info': 'O limite de chamados para o usuário será referente ao departamento escolhido. Exemplo: No total o usuário possui 30 chamados, porém somente 10 chamados pertencem ao departamento "Suporte", então o valor conferido será "30" ou "10" caso a caixa de seleção estiver selecionada.',
  'message-info': 'Após um chamado ser transferido para o usuário, caso esse campo estiver preenchido, irá enviar uma mensagem automática para o contato. Use {{nome_usuario}} como variável para incluir o nome do atendente.',
  'status-info': 'Selecione os status do usuário que pode receber transferências.',
  'frequency-info': 'Tabela de horários para configurar dias e horários de funcionamento da automação'
};

// Create balloons on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.info-button').forEach(button => {
    const infoId = button.getAttribute('data-info');
    const balloon = document.createElement('div');
    balloon.className = 'info-balloon';
    balloon.textContent = infoTexts[infoId];
    button.appendChild(balloon);
  });
});

// Loading messages
document.getElementById("loading").innerHTML = `
  <div class="spinner"></div>
  <p>Criando nova automação...</p>
`;

document.getElementById("loading_update").innerHTML = `
  <div class="spinner"></div>
  <p>Atualizando automação...</p>
`;
