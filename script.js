// script.js

let characters = [];

function addCharacter(name) {
  const defaultRelativeEvents = [
    "디스코는 없다",
    "타락한 낙원",
    "지옥으로 통하는 길",
    "케이론 작전",
    "다크사이트",
  ].map((label) => ({
    label,
    startTime: new Date().toISOString(),
    finishTime: new Date().toISOString(),
  }));

  characters.push({
    name: name,
    relativeEvents: defaultRelativeEvents,
    fixedEvents: [],
  });
  saveCharacters();
}

function removeCharacter(name) {
  characters = characters.filter((c) => c.name !== name);
  saveCharacters();
}

function getRelativeProgress(event) {
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.finishTime);
  const elapsed = (now - start) / 1000;
  const total = (end - start) / 1000;
  return Math.min(elapsed / total, 1);
}

function getRelativeProgressPercent(event) {
  return Math.floor(getRelativeProgress(event) * 100);
}

function getFixedEventStatus(event) {
  const start = new Date(event.startTime);
  const end = new Date(event.finishTime);
  return end > start ? "done" : "pending";
}

function getTimeDiffString(targetTime) {
  const now = new Date();
  const target = new Date(targetTime);
  let diff = Math.max((target - now) / 1000, 0);

  const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
  diff %= 3600;
  const minutes = String(Math.floor(diff / 60)).padStart(2, "0");
  const seconds = String(Math.floor(diff % 60)).padStart(2, "0");

  return `${hours}시 ${minutes}분 ${seconds}초`;
}

function saveCharacters() {
  localStorage.setItem("characters", JSON.stringify(characters));
}

function loadCharacters() {
  const data = localStorage.getItem("characters");
  if (data) {
    characters = JSON.parse(data);
  }
}

function playTTS(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

function updateVisualElements() {
  characters.forEach((character) => {
    const box = document.querySelector(
      `.character-box[data-name="${character.name}"]`
    );
    if (!box) return;

    const sections = box.querySelectorAll(".event-section");
    const relativeSection = sections[0];

    character.relativeEvents.forEach((event) => {
      const row = Array.from(
        relativeSection.querySelectorAll(".event-row")
      ).find(
        (r) => r.querySelector(".event-label")?.textContent === event.label
      );
      if (!row) return;
      const timeLabel = row.querySelector(".event-time");
      const fill = row.querySelector(".event-fill");
      const percent = getRelativeProgressPercent(event);
      fill.style.width = `${percent}%`;
      if (timeLabel)
        timeLabel.textContent = `(남은시간: ${getTimeDiffString(
          event.finishTime
        )})`;
      if (percent < 100) return;
      const alarm = box.querySelector(".character-header input[type=checkbox]");
      if (alarm?.checked && row.dataset.ttsPlayed == "false") {
        playTTS(
          `${character.name} 님 협동이벤트 ${event.label} 가실 시간입니다.`
        );
        row.dataset.ttsPlayed = "true";
      }
    });

    const fixedSection = sections[1];

    character.fixedEvents.forEach((event) => {
      const row = Array.from(fixedSection.querySelectorAll(".event-row")).find(
        (r) => r.querySelector(".event-label")?.textContent === event.label
      );
      if (!row) return;
      const timeLabel = row.querySelector(".event-time");
      const fill = row.querySelector(".event-fill");
      if (timeLabel) {
        timeLabel.textContent = `(남은시간: ${getTimeDiffString(
          event.finishTime
        )})`;
      }
      if (!fill) return;
      const percent = getRelativeProgressPercent(event);
      fill.style.width = `${percent}%`;
      if (percent < 100) return;
      const alarm = box.querySelector(".character-header input[type=checkbox]");
      if (alarm?.checked && row.dataset.ttsPlayed == "false") {
        playTTS(
          `${character.name} 님 비정규 일정 ${event.label} 가실 시간입니다.`
        );
        row.dataset.ttsPlayed = "true";
      }
    });
  });
}

function createCharacterDOM(character) {
  const box = document.createElement("div");
  box.className = "character-box";
  box.dataset.name = character.name;

  const header = document.createElement("div");
  header.className = "character-header";

  const nameLabel = document.createElement("div");
  nameLabel.textContent = character.name;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.onclick = () => {
    removeCharacter(character.name);
    box.remove();
  };

  const alarmLabel = document.createElement("label");
  alarmLabel.innerHTML = '알림 <input type="checkbox" checked />';

  header.appendChild(nameLabel);
  header.appendChild(deleteBtn);
  header.appendChild(alarmLabel);
  box.appendChild(header);

  const relativeSection = document.createElement("div");
  relativeSection.className = "event-section";
  const relativeTitle = document.createElement("h4");
  relativeTitle.textContent = "협동이벤트";
  relativeSection.appendChild(relativeTitle);

  character.relativeEvents.forEach((event) => {
    const row = document.createElement("div");
    row.className = "event-row";
    row.dataset.ttsPlayed = "true";

    const label = document.createElement("div");
    label.className = "event-label";
    label.textContent = event.label;

    const timeLabel = document.createElement("div");
    timeLabel.className = "event-time";

    const progressBar = document.createElement("div");
    progressBar.className = "event-bar";
    const fill = document.createElement("div");
    fill.className = "event-fill";

    progressBar.appendChild(fill);
    row.appendChild(label);
    row.appendChild(timeLabel);
    row.appendChild(progressBar);

    row.onclick = () => {
      const now = new Date();
      row.dataset.ttsPlayed = "false";
      const foundCharacter = characters.find((c) => c.name === character.name);
      if (!foundCharacter) return;
      const foundEvent = foundCharacter.relativeEvents.find(
        (e) => e.label === event.label
      );
      if (!foundEvent) return;
      foundEvent.startTime = now.toISOString();
      foundEvent.finishTime = new Date(now.getTime() + 3600000).toISOString();
      saveCharacters();
    };

    relativeSection.appendChild(row);
  });
  box.appendChild(relativeSection);

  const fixedSection = document.createElement("div");
  fixedSection.className = "event-section";

  const fixedTitle = document.createElement("h4");
  fixedTitle.textContent = "비정규 일정";
  fixedSection.appendChild(fixedTitle);

  // 고정 이벤트 입력 UI 생성
  const inputRow = document.createElement("div");
  inputRow.className = "event-row";

  const labelInput = document.createElement("input");
  labelInput.placeholder = "이벤트 이름";
  labelInput.style.marginRight = "4px";

  const timeInput = document.createElement("input");
  timeInput.type = "datetime-local";
  timeInput.style.marginRight = "4px";

  const intervalInput = document.createElement("input");
  intervalInput.type = "number";
  intervalInput.placeholder = "주기(분)";
  intervalInput.style.marginRight = "4px";
  intervalInput.style.width = "80px";

  const repeatInput = document.createElement("input");
  repeatInput.type = "number";
  repeatInput.placeholder = "반복";
  repeatInput.style.marginRight = "4px";
  repeatInput.style.width = "60px";

  const addBtn = document.createElement("button");
  addBtn.textContent = "➕";
  addBtn.onclick = () => {
    const label = labelInput.value.trim();
    const startTime = timeInput.value;
    const interval = parseInt(intervalInput.value) * 60;
    const repeat = parseInt(repeatInput.value);
    if (!label || !startTime || isNaN(interval) || isNaN(repeat)) return;

    const foundCharacter = characters.find((c) => c.name === character.name);
    if (!foundCharacter) return;

    foundCharacter.fixedEvents.push({
      label,
      startTime,
      finishTime: startTime, // 최초 생성 시 finishTime = startTime
      interval,
      repeat,
    });
    saveCharacters();
    const updatedBox = createCharacterDOM(foundCharacter);
    const area = document.getElementById("character-area");
    const oldBox = area.querySelector(
      `.character-box[data-name="${character.name}"]`
    );
    if (oldBox) area.replaceChild(updatedBox, oldBox);
  };

  inputRow.appendChild(labelInput);
  inputRow.appendChild(timeInput);
  inputRow.appendChild(intervalInput);
  inputRow.appendChild(repeatInput);
  inputRow.appendChild(addBtn);
  fixedSection.appendChild(inputRow);

  character.fixedEvents.forEach((event) => {
    const row = document.createElement("div");
    row.className = "event-row";
    row.dataset.ttsPlayed = "false";

    const labelRow = document.createElement("div");
    labelRow.style.display = "flex";
    labelRow.style.justifyContent = "space-between";
    labelRow.style.alignItems = "center";

    const label = document.createElement("div");
    label.className = "event-label";
    label.textContent = event.label;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      const foundCharacter = characters.find((c) => c.name === character.name);
      if (!foundCharacter) return;
      foundCharacter.fixedEvents = foundCharacter.fixedEvents.filter(
        (e) => e.label !== event.label
      );
      row.remove();
      saveCharacters();
    };

    labelRow.appendChild(label);
    labelRow.appendChild(deleteBtn);

    const timeLabel = document.createElement("div");
    timeLabel.className = "event-time";

    const progressBar = document.createElement("div");
    progressBar.className = "event-bar";
    const fill = document.createElement("div");
    fill.className = "event-fill";

    progressBar.appendChild(fill);
    row.appendChild(labelRow);
    row.appendChild(timeLabel);
    row.appendChild(progressBar);

    row.onclick = () => {
      const now = new Date();
      row.dataset.ttsPlayed = "false";
      const foundCharacter = characters.find((c) => c.name === character.name);
      if (!foundCharacter) return;
      const foundEvent = foundCharacter.fixedEvents.find(
        (e) => e.label === event.label
      );
      if (!foundEvent) return;

      const prevFinish = new Date(foundEvent.finishTime);
      const intervalMs = foundEvent.interval * 1000;

      if (prevFinish < now) {
        foundEvent.startTime = foundEvent.finishTime;
        foundEvent.finishTime = new Date(
          prevFinish.getTime() + intervalMs
        ).toISOString();
      }

      foundEvent.repeat -= 1;
      if (foundEvent.repeat < 0) {
        foundEvent.repeat = -1;
      } else if (foundEvent.repeat === 0) {
        foundCharacter.fixedEvents = foundCharacter.fixedEvents.filter(
          (e) => e.label !== foundEvent.label
        );
        row.remove();
      }

      saveCharacters();
    };

    fixedSection.appendChild(row);
  });
  box.appendChild(fixedSection);

  return box;
}

function createCharacter() {
  const name = document.getElementById("name-input").value.trim();
  if (!name) return;

  addCharacter(name);
  const character = characters.find((c) => c.name === name);
  const box = createCharacterDOM(character);
  document.getElementById("character-area").appendChild(box);
  document.getElementById("name-input").value = "";
}

window.addEventListener("DOMContentLoaded", () => {
  setInterval(updateVisualElements, 200);
  loadCharacters();
  const area = document.getElementById("character-area");
  characters.forEach((character) => {
    const box = createCharacterDOM(character);
    area.appendChild(box);
  });
});
