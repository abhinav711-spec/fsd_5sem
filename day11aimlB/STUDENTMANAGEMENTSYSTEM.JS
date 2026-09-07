const studentForm = document.getElementById("studentForm");
const studentName = document.getElementById("studentName");
const rollNumber = document.getElementById("rollNumber");
const course = document.getElementById("course");
const marks = document.getElementById("marks");
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");
const totalStudents = document.getElementById("totalStudents");
const averageMarks = document.getElementById("averageMarks");
const recordCount = document.getElementById("recordCount");
const searchResult = document.getElementById("searchResult");

let students = [];

studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const score = Number(marks.value);

    if (score < 0 || score > 100 || marks.value === "") {
        showMessage("Marks must be a number between 0 and 100.");
        marks.focus();
        return;
    }

    if (students.some((student) => student.roll.toLowerCase() === rollNumber.value.trim().toLowerCase())) {
        showMessage("That roll number already has a student record.");
        rollNumber.focus();
        return;
    }

    students.push({ name: studentName.value.trim(), roll: rollNumber.value.trim(), course: course.value, marks: score });
    studentForm.reset();
    showMessage("Student added successfully.", "success");
    renderStudents();
    studentName.focus();
});

searchInput.addEventListener("input", renderStudents);
tableBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete]");
    if (!deleteButton) return;
    students = students.filter((student) => student.roll !== deleteButton.dataset.delete);
    renderStudents();
});

function showMessage(message, type = "error") {
    formMessage.textContent = message;
    formMessage.style.color = type === "success" ? "#3d9b91" : "#e2685d";
}

function getGrade(score) {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
}

function renderStudents() {
    const query = searchInput.value.trim().toLowerCase();
    const visibleStudents = students.filter((student) => `${student.name} ${student.roll}`.toLowerCase().includes(query));
    tableBody.innerHTML = visibleStudents.map((student) => `
        <tr>
            <td class="student-name">${escapeHtml(student.name)}</td>
            <td class="roll">${escapeHtml(student.roll)}</td>
            <td>${escapeHtml(student.course)}</td>
            <td class="mark">${student.marks}/100</td>
            <td><span class="grade">${getGrade(student.marks)}</span></td>
            <td><button class="action-button" type="button" data-delete="${escapeHtml(student.roll)}">Delete</button></td>
        </tr>`).join("");

    emptyState.hidden = visibleStudents.length > 0;
    totalStudents.textContent = students.length;
    recordCount.textContent = `${students.length} ${students.length === 1 ? "record" : "records"}`;
    const average = students.length ? students.reduce((sum, student) => sum + student.marks, 0) / students.length : 0;
    averageMarks.innerHTML = `${average.toFixed(1)}<span class="small-unit">%</span>`;
    searchResult.textContent = query ? `${visibleStudents.length} matching ${visibleStudents.length === 1 ? "record" : "records"}` : "Showing all records";
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

renderStudents();