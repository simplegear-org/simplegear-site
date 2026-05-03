const payload = new URLSearchParams(window.location.search).get('payload');
const openInviteLinks = Array.from(document.querySelectorAll('#open-invite-link'));
const inviteCard = document.getElementById('invite-card');
const trustCard = document.getElementById('trust-card');
const inviteMessage = document.getElementById('invite-message');

function showInviteMissing() {
  if (inviteMessage) {
    inviteMessage.textContent = 'No invite payload was found in this link.';
  }
  openInviteLinks.forEach((link) => {
    link.href = '/';
    link.textContent = 'Go to PeerLink';
  });
}

if (payload) {
  const appLink = `peerlink://invite?payload=${encodeURIComponent(payload)}`;
  if (inviteCard) {
    inviteCard.hidden = false;
  }
  if (trustCard) {
    trustCard.hidden = true;
  }
  openInviteLinks.forEach((link) => {
    link.href = appLink;
  });
  window.setTimeout(() => {
    window.location.href = appLink;
  }, 350);
} else if (window.location.pathname.includes('/invite')) {
  showInviteMissing();
} else {
  openInviteLinks.forEach((link) => {
    link.hidden = true;
  });
}
