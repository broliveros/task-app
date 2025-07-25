document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("task-form");
    const input = document.getElementById("task-input");
    const list = document.getElementById("task-list");

    const filterButtons = document.querySelectorAll("#filter-buttons button");
    let currentFilter = "all";

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter;

            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            renderTasks();
        });
    });

    let searchQuery = "";
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderTasks(currentFilter);
    });

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function renderTasks(activeFilter = currentFilter) {
        list.innerHTML = "";

        let visibleTasks = tasks.filter(task => {
            if (activeFilter === "active" && task.completed) return false;
            if (activeFilter === "completed" && !task.completed) return false;
            
            if (searchQuery && !task.text.toLowerCase().includes(searchQuery)) return false;
            
            return true;
        });

        visibleTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        visibleTasks.forEach((task) => {
            const li = document.createElement("li");
            li.dataset.id = task.id;
            li.setAttribute("draggable", "true");
        
            const now = new Date();
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate - now;
                const oneDay = 24 * 60 * 60 * 1000;
             
                if (timeDiff < -oneDay) li.classList.add("task-overdue");
                else if (timeDiff < oneDay) li.classList.add("task-due-soon");
                else li.classList.add("task-future");
            }
                        
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.addEventListener("change", () => {
                task.completed = checkbox.checked;
                saveTasks();
                renderTasks(activeFilter);
            });

            const priorityBadge = `<span class="priority-badge ${task.priority}">${task.priority}</span>`;

            const span = document.createElement("span");
            span.innerHTML = task.dueDate
            ? `${task.text} ${priorityBadge}<br><small style="color: gray;"><em>Due: ${task.dueDate}</em></small>`
            : `${task.text} ${priorityBadge}`;

            if (task.completed) span.classList.add("completed");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.className = "edit-btn";
            editBtn.addEventListener("click", () => {
                li.innerHTML= "";

                const editInput = document.createElement("input");
                editInput.type = "text";
                editInput.value = task.text;

                const editDate = document.createElement("input");
                editDate.type = "date";
                editDate.value = task.dueDate || "";

                const editPriority = document.createElement("select");
                ["low","medium", "high"].forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p;
                    opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
                    if (task.priority === p) opt.selected = true;
                    editPriority.appendChild(opt);
                });

                const saveBtn = document.createElement("button");
                saveBtn.textContent = "Save";
                saveBtn.className = "save-btn";

                const cancelBtn = document.createElement("button");
                cancelBtn.textContent = "Cancel";
                cancelBtn.className = "cancel-btn";

                saveBtn.addEventListener("click", () => {
                    task.text = editInput.value.trim();
                    task.dueDate = editDate.value;
                    task.priority = editPriority.value;
                    saveTasks();
                    renderTasks(activeFilter);
                });

                cancelBtn.addEventListener("click", () => {
                    renderTasks(filter);
                });

            li.appendChild(checkbox);
            li.appendChild(editInput);
            li.appendChild(editDate);
            li.appendChild(editPriority);
            li.appendChild(saveBtn);
            li.appendChild(cancelBtn);
        });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "X";
            deleteBtn.className = "delete-btn";
            deleteBtn.addEventListener("click", () => {
                tasks = tasks.filter((t) => t.id !== task.id);
                saveTasks();
                renderTasks(activeFilter);
            });

                const contentDiv = document.createElement("div");
                contentDiv.className = "task-content";
                contentDiv.appendChild(checkbox);
                contentDiv.appendChild(span);

                const btnDiv = document.createElement("div");
                btnDiv.className = "task-buttons";
                btnDiv.appendChild(editBtn);
                btnDiv.appendChild(deleteBtn);

                li.appendChild(contentDiv);
                li.appendChild(btnDiv);
                list.appendChild(li);

                requestAnimationFrame(() => {
                    li.classList.add("show");
                });
        });
    

    list.addEventListener("dragstart", (e) => {
        if (e.target.tagName === "LI") {
            e.target.classList.add("dragging");
        }
    });

    list.addEventListener("dragend", (e) => {
        if (e.target.tagName === "LI") {
            e.target.classList.remove("dragging");

            const visibleOrder = Array.from(list.querySelectorAll("li")).map((li) => {
                return tasks.find((t) => t.id === parseInt(li.dataset.id, 10));
            });

            const hiddenTasks = tasks.filter((t) => !visibleOrder.includes(t));
            
            tasks = [...visibleOrder, ...hiddenTasks];

            saveTasks();
            renderTasks(currentFilter);
             }
        });

    list.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        if (!dragging) return;

        const afterElement = getDragAfterElement(list, e.clientY);
        list.querySelectorAll("li").forEach((li) => li.classList.remove("drag-over"));
        
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            afterElement.classList.add("drag-over");
            list.insertBefore(dragging, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

        return draggableElements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY, element: null }
        ).element;
    }
    
        form.addEventListener("submit", (e) => {
        e.preventDefault();
        const taskText = input.value.trim();
        const dueDate = document.getElementById("due-date").value;
        const priority = document.getElementById("priority").value;

        if (!taskText) return;

        tasks.push({
            id: Date.now(),
            text: taskText,
            completed: false,
            dueDate,
            priority
        });
    
    saveTasks();
    renderTasks(currentFilter);
    input.value = "";
    document.getElementById("due-date").value = "";
});

    document.getElementById("clear-completed-btn").addEventListener("click", () => {
        tasks = tasks.filter((task) => !task.completed);
        saveTasks();
        renderTasks();
    });
   }
});
