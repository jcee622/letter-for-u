const STORAGE_KEY = 'open-when-letters-v1';
const isRecipientPage = document.body.dataset.page === 'recipient';

function generateLetterId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `letter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultLetters = [
  {
    id: generateLetterId(),
    recipient: 'You Miss Me',
    sender: 'Your person',
    occasion: 'Open when',
    message: 'When you miss me, I hope this letter reminds you that I am still here, in every warm thought, every quiet smile, and every place your heart reaches for mine. No matter how far apart we are, I am carrying you with me — in my heart, in my dreams, and in all the little moments that feel like home when you are near.'
  },
  {
    id: generateLetterId(),
    recipient: 'You Need a Smile',
    sender: 'Your favorite person',
    occasion: 'Open when',
    message: 'I hope this is the little reminder you needed: you are loved more than you know, and there is a softness in your soul that makes the world brighter just by being in it. Smile, even if it is tiny. A smile is still a little spark of light, and you are the kind of light that makes other people feel less alone.'
  },
  {
    id: generateLetterId(),
    recipient: 'You Feel Sad',
    sender: 'The one who loves you most',
    occasion: 'Open when',
    message: 'It is okay to feel sad sometimes. Even the strongest hearts need rest and gentleness. I hope you remember that you are never too much, never too difficult, and never alone. I will always be here, loving you in the quiet ways and the loudest ways, holding space for your feelings and cheering for your healing every day.'
  }
];

const letterForm = document.getElementById('letterForm');
const recipientInput = document.getElementById('recipientInput');
const letterInput = document.getElementById('letterInput');
const fromInput = document.getElementById('fromInput');
const occasionInput = document.getElementById('occasionInput');
const lettersGrid = document.getElementById('lettersGrid');

function resizeMessageBox() {
  if (!letterInput) return;

  letterInput.style.height = 'auto';
  letterInput.style.height = `${letterInput.scrollHeight}px`;
}

function normalizeLetters(list) {
  return list.map((letter) => ({
    ...letter,
    id: letter.id || generateLetterId(),
    recipient: letter.recipient || 'My Boss',
    sender: letter.sender || 'Your person',
    occasion: letter.occasion || 'Open when',
    message: letter.message || 'I love you more than words could ever say.'
  }));
}

function getStoredLetters() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        return normalizeLetters(parsed);
      }
    } catch (error) {
      console.warn('Could not read saved letters:', error);
    }
  }

  const letters = normalizeLetters(defaultLetters);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
  return letters;
}

function getSharedLetter() {
  const encodedLetter = new URLSearchParams(window.location.search).get('letter');

  if (!encodedLetter) return null;

  try {
    return normalizeLetters([JSON.parse(encodedLetter)])[0];
  } catch (error) {
    console.warn('Could not read shared letter:', error);
    return null;
  }
}

function saveLetters(letters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeLetters(letters)));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function bindLetterCard(card, letter) {
  const envelope = card.querySelector('.envelope');
  const button = card.querySelector('button');
  const copyLinkButton = card.querySelector('.copy-link');

  const toggleCard = () => {
    const isOpen = card.classList.contains('is-open');

    document.querySelectorAll('.letter-card').forEach((item) => {
      item.classList.remove('is-open');
      const itemButton = item.querySelector('button');
      if (itemButton) itemButton.textContent = 'Open letter';
    });

    if (!isOpen) {
      card.classList.add('is-open');
      if (button) button.textContent = 'Close letter';
    }
  };

  if (envelope) {
    envelope.addEventListener('click', toggleCard);
  }

  if (button) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleCard();
    });
  }

  if (copyLinkButton && !isRecipientPage) {
    copyLinkButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      const sharedLetter = letter;
      const sharePath = window.location.pathname.replace(/[^/]*$/, 'recipient.html');
      const shareUrl = `${window.location.origin}${sharePath}?letter=${encodeURIComponent(JSON.stringify(sharedLetter))}`;

      try {
        await navigator.clipboard.writeText(shareUrl);
        copyLinkButton.textContent = 'Copied!';
        setTimeout(() => {
          copyLinkButton.textContent = 'Copy Link';
        }, 1200);
      } catch (error) {
        copyLinkButton.textContent = 'Copy failed';
        setTimeout(() => {
          copyLinkButton.textContent = 'Copy Link';
        }, 1200);
      }
    });
  }
}

function buildLetterCard(letter) {
  const card = document.createElement('article');
  card.className = 'letter-card';
  card.dataset.letterId = letter.id;

  const safeRecipient = (letter.recipient || 'My Love').trim() || 'My Love';
  const safeSender = (letter.sender || 'Your person').trim() || 'Your person';
  const safeOccasion = (letter.occasion || 'Open when').trim() || 'Open when';
  const safeMessage = (letter.message || 'I love you more than words could ever say.').trim() || 'I love you more than words could ever say.';

  const actionMarkup = isRecipientPage
    ? ''
    : `<div class="card-actions"><button type="button" class="copy-link" data-letter-id="${escapeHtml(letter.id)}">Copy Link</button></div>`;

  card.innerHTML = `
    <div class="envelope">
      <div class="seal">❤</div>
      <div class="label-tag">${escapeHtml(safeOccasion)}</div>
      <h2>${escapeHtml(safeRecipient)}</h2>
      <button type="button">Open letter</button>
    </div>

    <div class="letter-content">
      <p>My dearest ${escapeHtml(safeRecipient)},</p>
      ${createParagraphs(safeMessage)}
      <p class="signature">With all my love,<br />${escapeHtml(safeSender)}</p>
    </div>

    ${actionMarkup}
  `;

  bindLetterCard(card, letter);
  return card;
}

function renderLetters() {
  const sharedLetter = isRecipientPage ? getSharedLetter() : null;
  const letters = sharedLetter ? [sharedLetter] : getStoredLetters();
  lettersGrid.innerHTML = '';
  letters.forEach((letter) => {
    lettersGrid.appendChild(buildLetterCard(letter));
  });
}

if (letterForm) {
  letterInput.addEventListener('input', resizeMessageBox);

  letterForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const recipient = recipientInput.value.trim();
    const message = letterInput.value.trim();
    const sender = fromInput.value.trim();
    const occasion = occasionInput.value.trim();

    const newLetter = {
      id: generateLetterId(),
      recipient: recipient || 'My Love',
      sender: sender || 'Your person',
      occasion: occasion || 'Open when',
      message: message || 'I love you more than words could ever say.'
    };

    const currentLetters = getStoredLetters();
    currentLetters.unshift(newLetter);
    saveLetters(currentLetters);
    renderLetters();

    letterForm.reset();
    recipientInput.value = 'My Love';
    letterInput.value = '';
    fromInput.value = '';
    occasionInput.value = '';
    resizeMessageBox();
  });
}

renderLetters();
resizeMessageBox();
