import QRCode from 'qrcode'

/* EAN-13: префикс 234 + id водителя до 12 знаков + контрольная цифра */

function calculateEAN13Checksum(code) {
  const multipliers = [1, 3]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * multipliers[i % 2]
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

export function generateEAN13Code(itemId) {
  const prefix = '234'
  const baseCode = prefix + itemId.toString().padStart(9, '0')
  return baseCode + calculateEAN13Checksum(baseCode)
}

/** Рисует QR с кодом водителя и подписью «ID:… ФИО» и скачивает PNG. */
export async function downloadQRCodeImage(item) {
  const barcodeValue = generateEAN13Code(item.id)

  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 330 // запас по высоте под подпись
  const ctx = canvas.getContext('2d')

  // QR рисуем на отдельной канве и переносим на основную
  const qrCanvas = document.createElement('canvas')
  qrCanvas.width = 300
  qrCanvas.height = 300
  await QRCode.toCanvas(qrCanvas, barcodeValue, {
    width: 300,
    height: 300,
    margin: 1,
    scale: 4,
    dpi: 300,
  })

  // фон белый: иначе прозрачная полоса под подписью
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(qrCanvas, 0, 0)

  ctx.font = '20px Arial'
  ctx.fillStyle = 'black'
  ctx.textAlign = 'center'
  ctx.fillText('ID:' + item.id + ' ' + item.fio, canvas.width / 2, 320)

  const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
  const link = document.createElement('a')
  link.download = `${item.id}_${item.fio}.png`
  link.href = image
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
