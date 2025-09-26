export const exportJSON = (data, filename = 'dados.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Importa um arquivo JSON e devolve como objeto
export const importJSON = (event, callback) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // 🔹 Validação mínima
      if (
        data &&
        Array.isArray(data.competitors) &&
        Array.isArray(data.rounds)
      ) {
        callback(data);
        alert('✅ Sorteio importado com sucesso!');
      } else {
        throw new Error('Formato inválido');
      }
    } catch (err) {
      console.error('Erro ao importar JSON:', err);
      alert('Erro ao importar arquivo JSON. Verifique o formato.');
    }
  };
  reader.readAsText(file);
};
