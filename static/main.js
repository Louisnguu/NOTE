let noteContainer = document.querySelector(".noteContainer");
let addNoteForm = document.querySelector(".addNote");
let closeButton = document.querySelector(".closeButton");
let noteDetailView = document.querySelector(".noteDetailView");
let closeDetailView = document.querySelector(".closeDetailView");
let currentNote = null;
let data;

function openForm() {
    addNoteForm.style.display = "flex";
}

function createNote() {
    let noteTitle = document.getElementById("noteTitle").value.trim();
    let noteBody = document.getElementById("noteBody").value.trim();
    let noteType = document.getElementById("noteType").value;
    let noteDateTime = document.getElementById("noteDateTime").value; 

    if (!noteTitle || !noteBody || !noteDateTime) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    data = {
        _title: noteTitle,
        _body: noteBody,
        _type: noteType,
        date_time: noteDateTime.replace("T", " ") 
    };

    let notes = JSON.parse(localStorage.getItem("notes")) || [];

    if (currentNote) {
        // Cập nhật ghi chú hiện tại
        currentNote.querySelector(".noteType").textContent = noteType;
        currentNote.querySelector(".title").textContent = noteTitle;
        currentNote.querySelector(".bodyText").textContent = noteBody;
        currentNote.querySelector(".date").textContent = noteDateTime.replace("T", " ");
        setNoteTypeClass(currentNote.querySelector(".noteType"), noteType);

        let index = notes.findIndex(note => note._title === currentNote.dataset.title);
        if (index !== -1) notes[index] = data;

        currentNote = null;
    } else {
        // Thêm ghi chú mới
        const noteDiv = createNoteDiv(data);
        noteContainer.appendChild(noteDiv);
        notes.push(data);
    }

    localStorage.setItem("notes", JSON.stringify(notes));
    sendNote();  
    clearForm();
}


function setNoteTypeClass(element, type) {
    element.className = "noteType";
    element.classList.add(type);
}

function createNoteDiv(note) {
    const { _type, _title, _body, date_time } = note;
    const noteDiv = createElement("div", ["note"]);
    noteDiv.dataset.title = _title;

    const buttonContainerDiv = createElement("div", ["buttonContainer"]);
    const noteTypeDiv = createElement("div", ["noteType", _type], _type);
    const iconContainerDiv = createElement("div", ["iconContainer"]);

    const detailViewIcon = createElement("i", ["far", "fa-eye"]);
    detailViewIcon.addEventListener("click", () => handleDetailView(noteDiv));

    const editIcon = createElement("i", ["fas", "fa-edit"]);
    editIcon.addEventListener("click", () => handleEdit(noteDiv));

    const trashIcon = createElement("i", ["fas", "fa-trash"]);
    trashIcon.addEventListener("click", () => handleDelete(noteDiv));

    iconContainerDiv.append(detailViewIcon, editIcon, trashIcon);
    buttonContainerDiv.append(noteTypeDiv, iconContainerDiv);

    const titleDiv = createElement("div", ["title"], _title);
    const bodyTextDiv = createElement("div", ["bodyText"], _body);
    const dateDiv = createElement("div", ["date"], date_time); // Hiển thị ngày giờ đầy đủ

    noteDiv.append(buttonContainerDiv, titleDiv, bodyTextDiv, dateDiv);
    return noteDiv;
}

async function handleDelete(noteDiv) {
    let title = noteDiv.dataset.title;
    let confirmDelete = confirm(`Bạn có chắc muốn xóa ghi chú?\nTiêu đề: ${title}`);

    if (confirmDelete) {
        noteDiv.remove();
        deleteNoteFromLocalStorage(title);
        try {
            let response = await fetch("http://127.0.0.1:5000/delete_note", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title })
            });

            let result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error("Lỗi khi xóa ghi chú:", error);
        }
    }
}

function deleteNoteFromLocalStorage(title) {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes = notes.filter(note => note._title !== title);
    localStorage.setItem("notes", JSON.stringify(notes));
}

// Tải ghi chú từ LocalStorage khi mở lại trang
document.addEventListener("DOMContentLoaded", () => {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.forEach(note => {
        const noteDiv = createNoteDiv(note);
        noteContainer.appendChild(noteDiv);
    });
});

function clearForm() {
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteBody").value = "";
    document.getElementById("noteType").value = "Home";
    document.getElementById("noteDateTime").value = "";
    addNoteForm.style.display = "none";
}

function createElement(tag, className = [], textContent = "") {
    const element = document.createElement(tag);
    className.forEach(classItem => element.classList.add(classItem));
    element.textContent = textContent;
    return element;
}

closeButton.addEventListener("click", () => {
    addNoteForm.style.display = "none";
});

closeDetailView.addEventListener("click", () => {
    noteDetailView.style.display = "none";
});

async function sendNote() 
{
    try 
    {
        let response=await fetch("http://127.0.0.1:5000/save_note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

    } 
    catch (error) 
    {
        console.error("Lỗi:", error);
    }
}
