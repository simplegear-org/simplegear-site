(function () {
  const target = document.body?.dataset.redirectTo;
  if (!target || !target.startsWith('/')) {
    return;
  }

  window.location.replace(`${target}${window.location.search}${window.location.hash}`);
})();
