const releaseForm = document.getElementById("releaseForm");
const releaseList = document.getElementById("releaseList");
const template = document.getElementById("releaseTemplate");

const STATUS_OPTIONS = ["pending", "uploaded", "failed"];

releaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(releaseForm);
  const selectedPlatforms = Array.from(document.getElementById("platforms").selectedOptions).map(
    (option) => option.value,
  );
  formData.set("platforms", selectedPlatforms.join(","));

  const response = await fetch("/api/releases", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json();
    alert(payload.error || "Unable to save release");
    return;
  }

  releaseForm.reset();
  await loadReleases();
});

async function loadReleases() {
  const response = await fetch("/api/releases");
  const releases = await response.json();

  releaseList.innerHTML = "";
  if (!releases.length) {
    releaseList.innerHTML = "<p>No releases yet. Add your first release above.</p>";
    return;
  }

  releases.forEach((release) => {
    const node = template.content.cloneNode(true);
    node.querySelector("[data-title]").textContent = release.title;
    node.querySelector("[data-meta]").textContent = `${release.artist} • ${formatDate(release.releaseDate)}`;
    node.querySelector("[data-description]").textContent = release.description || "No description";

    const audioLink = node.querySelector("[data-audio]");
    audioLink.href = release.files.audio.storagePath;

    if (release.files.artwork?.storagePath) {
      const artworkWrap = node.querySelector("[data-artwork-wrap]");
      artworkWrap.classList.remove("hidden");
      node.querySelector("[data-artwork]").src = release.files.artwork.storagePath;
    }

    const platformsWrap = node.querySelector("[data-platforms]");
    release.platforms.forEach((platform) => {
      const row = document.createElement("div");
      row.className = "platform-row";

      const name = document.createElement("strong");
      name.textContent = platform;

      const statusSelect = document.createElement("select");
      STATUS_OPTIONS.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
      });

      statusSelect.value = release.manualUploadStatus[platform] || "pending";
      statusSelect.addEventListener("change", () =>
        updatePlatformStatus(release.id, platform, statusSelect.value),
      );

      row.append(name, statusSelect);
      platformsWrap.appendChild(row);
    });

    releaseList.appendChild(node);
  });
}

async function updatePlatformStatus(id, platform, status) {
  const response = await fetch(`/api/releases/${id}/platform-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ platform, status }),
  });

  if (!response.ok) {
    alert("Unable to update platform status");
  }
}

function formatDate(value) {
  if (!value) {
    return "No release date";
  }

  return new Date(value).toLocaleDateString();
}

loadReleases();
