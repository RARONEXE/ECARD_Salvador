const correctPassword = "012191";
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const feedScreen = document.getElementById("feedScreen");
const feed = document.getElementById("feed");
const feedProgress = document.getElementById("feedProgress");
const scrollHint = document.getElementById("scrollHint");
const inviteDialog = document.getElementById("inviteDialog");
const inviteActions = document.getElementById("inviteActions");
const closeInviteButton = document.getElementById("closeInvite");
const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const messageDialog = document.getElementById("messageDialog");
const seenPages = new Set();
const maxCloseButtonDodges = 10;
let invitationShown = false;
let closeButtonDodges = 0;

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (loginPassword.value !== correctPassword) {
        loginError.hidden = false;
        loginPassword.select();
        return;
    }

    loginError.hidden = true;
    feedScreen.hidden = false;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        loginScreen.hidden = true;
        feed.focus();
        return;
    }

    loginScreen.classList.add("is-leaving");
    feedScreen.classList.add("is-entering");

    let openingFallback;
    const completeOpening = () => {
        window.clearTimeout(openingFallback);
        feedScreen.removeEventListener("animationend", finishOpeningAnimation);
        loginScreen.hidden = true;
        loginScreen.classList.remove("is-leaving");
        feedScreen.classList.remove("is-entering");
        feed.focus();
    };
    const finishOpeningAnimation = (animationEvent) => {
        if (animationEvent.target === feedScreen && animationEvent.animationName === "card-reveal") {
            completeOpening();
        }
    };

    feedScreen.addEventListener("animationend", finishOpeningAnimation);
    openingFallback = window.setTimeout(completeOpening, 1400);
});

const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            return;
        }

        entry.target.classList.add("is-visible");
        seenPages.add(entry.target.dataset.page);
        feedProgress.textContent = `${seenPages.size} / 4`;

        if (seenPages.size === 4 && !invitationShown) {
            invitationShown = true;
            scrollHint.hidden = true;
            inviteDialog.showModal();
        }
    });
}, {
    root: feed,
    threshold: 0.65
});

document.querySelectorAll(".page").forEach((page) => {
    pageObserver.observe(page);
});

document.querySelectorAll(".track-button").forEach((button) => {
    button.addEventListener("click", () => {
        const targetPage = document.getElementById(button.dataset.pageTarget);
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        targetPage.scrollIntoView({ behavior, block: "start" });
    });
});

closeInviteButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" && closeButtonDodges < maxCloseButtonDodges) {
        dodgeCloseButton(event);
    }
});

closeInviteButton.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" && closeButtonDodges < maxCloseButtonDodges) {
        event.preventDefault();
        dodgeCloseButton(event);
    }
});

closeInviteButton.addEventListener("click", (event) => {
    if (closeButtonDodges < maxCloseButtonDodges) {
        event.preventDefault();
        dodgeCloseButton(event);
        return;
    }

    inviteDialog.close();
});

closeInviteButton.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && closeButtonDodges < maxCloseButtonDodges) {
        event.preventDefault();
        dodgeCloseButton();
    }
});

yesButton.addEventListener("click", () => {
    inviteDialog.close();
    messageDialog.showModal();
});

noButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
        dodgeNoButton(event);
    }
});

noButton.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") {
        event.preventDefault();
        dodgeNoButton(event);
    }
});

noButton.addEventListener("click", (event) => {
    event.preventDefault();
    dodgeNoButton(event);
});

noButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dodgeNoButton();
    }
});

function dodgeNoButton(event) {
    moveButtonAway(noButton, inviteActions, event);
    noButton.classList.remove("glitching");
    void noButton.offsetWidth;
    noButton.classList.add("glitching");
}

function dodgeCloseButton(event) {
    closeButtonDodges += 1;

    if (closeButtonDodges >= maxCloseButtonDodges) {
        closeInviteButton.style.position = "";
        closeInviteButton.style.left = "";
        closeInviteButton.style.right = "";
        closeInviteButton.style.top = "";
        closeInviteButton.classList.remove("glitching");
        return;
    }

    moveButtonAway(closeInviteButton, inviteDialog, event);
    closeInviteButton.classList.remove("glitching");
    void closeInviteButton.offsetWidth;
    closeInviteButton.classList.add("glitching");
}

function moveButtonAway(buttonElement, container, event) {
    const stage = container.getBoundingClientRect();
    const button = buttonElement.getBoundingClientRect();
    const inset = 12;
    const maxLeft = Math.max(0, stage.width - button.width);
    const maxTop = Math.max(0, stage.height - button.height);
    let left = 0;
    let top = 0;
    let movedAway = false;

    for (let attempt = 0; attempt < 40; attempt += 1) {
        left = Math.random() * maxLeft;
        top = Math.random() * maxTop;

        if (!event || Math.hypot(
            stage.left + left + button.width / 2 - event.clientX,
            stage.top + top + button.height / 2 - event.clientY
        ) > Math.max(button.width, button.height) / 2 + 24) {
            movedAway = true;
            break;
        }
    }

    if (!movedAway && event) {
        left = event.clientX < stage.left + stage.width / 2 ? maxLeft : 0;
        top = event.clientY < stage.top + stage.height / 2 ? maxTop : 0;
    }

    buttonElement.style.position = "absolute";
    buttonElement.style.left = `${Math.max(inset, Math.min(left, maxLeft - inset))}px`;
    buttonElement.style.right = "auto";
    buttonElement.style.top = `${Math.max(inset, Math.min(top, maxTop - inset))}px`;
}

document.getElementById("closeMessage").addEventListener("click", () => {
    messageDialog.close();
});
