export interface PerformanceMetrics {
  kmTraveled: number
  activeHours: number
  activeMinutes: number
  zonesVisited: number
  peakHour: string
}

export interface Zone {
  latitude: number
  longitude: number
  visitCount: number
}

export interface AnalyticsData {
  hourly: Array<{ hour: string; count: number }>
  status: Array<{ name: string; value: number }>
  deliverers: Array<{ name: string; orders: number }>
}

export const exportPerformancePDF = async (
  delivererName: string,
  period: string,
  metrics: PerformanceMetrics,
  zones: Zone[]
) => {
  const { jsPDF } = await import('jspdf')
  const autoTable = await import('jspdf-autotable')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFontSize(24)
  doc.setTextColor(78, 205, 196)
  doc.text('PEPOS CAKE', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('Reporte de Desempeño de Domiciliario', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(50, 50, 50)
  doc.text(`Domiciliario: ${delivererName}`, 20, 45)
  doc.text(`Período: ${period}`, 20, 52)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 20, 59)

  const metricsData = [
    ['Métrica', 'Valor'],
    ['Distancia recorrida', `${metrics.kmTraveled.toFixed(2)} km`],
    ['Tiempo activo', `${metrics.activeHours}h ${metrics.activeMinutes}m`],
    ['Zonas visitadas', `${metrics.zonesVisited}`],
    ['Hora pico', metrics.peakHour],
  ]

  autoTable.default(doc, {
    head: [metricsData[0]],
    body: metricsData.slice(1),
    startY: 70,
    theme: 'grid',
    headStyles: { fillColor: [78, 205, 196], textColor: [255, 255, 255] },
    bodyStyles: { textColor: [50, 50, 50] },
  })

  const tableEndY = (doc as any).lastAutoTable.finalY + 15

  doc.setFontSize(12)
  doc.setTextColor(78, 205, 196)
  doc.text('Zonas Visitadas', 20, tableEndY)

  const zonesData = [
    ['Latitud', 'Longitud', 'Visitas'],
    ...zones.slice(0, 10).map(z => [z.latitude.toFixed(4), z.longitude.toFixed(4), z.visitCount.toString()]),
  ]

  autoTable.default(doc, {
    head: [zonesData[0]],
    body: zonesData.slice(1),
    startY: tableEndY + 5,
    theme: 'grid',
    headStyles: { fillColor: [78, 205, 196], textColor: [255, 255, 255] },
    bodyStyles: { textColor: [50, 50, 50] },
  })

  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text('© 2026 PEPOS CAKE - Sistema de Gestión de Entregas', pageWidth / 2, pageHeight - 10, { align: 'center' })

  doc.save(`Reporte_${delivererName}_${new Date().getTime()}.pdf`)
}

export const exportPerformanceExcel = async (
  delivererName: string,
  period: string,
  metrics: PerformanceMetrics,
  zones: Zone[]
) => {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()

  const metricsSheet = workbook.addWorksheet('Métricas')
  metricsSheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 20 },
  ]

  metricsSheet.addRow({ metric: `Reporte de ${delivererName}`, value: '' })
  metricsSheet.addRow({ metric: `Período: ${period}`, value: '' })
  metricsSheet.addRow({ metric: `Fecha: ${new Date().toLocaleDateString('es-CO')}`, value: '' })
  metricsSheet.addRow({})

  metricsSheet.addRow({ metric: 'Distancia recorrida (km)', value: metrics.kmTraveled.toFixed(2) })
  metricsSheet.addRow({ metric: 'Tiempo activo (horas)', value: metrics.activeHours })
  metricsSheet.addRow({ metric: 'Tiempo activo (minutos)', value: metrics.activeMinutes })
  metricsSheet.addRow({ metric: 'Zonas visitadas', value: metrics.zonesVisited })
  metricsSheet.addRow({ metric: 'Hora pico', value: metrics.peakHour })

  const zonesSheet = workbook.addWorksheet('Zonas')
  zonesSheet.columns = [
    { header: 'Latitud', key: 'latitude', width: 15 },
    { header: 'Longitud', key: 'longitude', width: 15 },
    { header: 'Visitas', key: 'visitCount', width: 12 },
  ]

  zonesSheet.addRow({ metric: 'Top Zonas Visitadas', value: '' })
  zones.slice(0, 20).forEach(zone => {
    zonesSheet.addRow({
      latitude: zone.latitude.toFixed(4),
      longitude: zone.longitude.toFixed(4),
      visitCount: zone.visitCount,
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Reporte_${delivererName}_${new Date().getTime()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export const exportAnalyticsExcel = async (data: AnalyticsData) => {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()

  const hourlySheet = workbook.addWorksheet('Actividad Horaria')
  hourlySheet.columns = [
    { header: 'Hora', key: 'hour', width: 15 },
    { header: 'Cantidad de Pedidos', key: 'count', width: 20 },
  ]
  data.hourly.forEach(item => hourlySheet.addRow({ hour: item.hour, count: item.count }))

  const statusSheet = workbook.addWorksheet('Estados')
  statusSheet.columns = [
    { header: 'Estado', key: 'name', width: 20 },
    { header: 'Cantidad', key: 'value', width: 15 },
  ]
  data.status.forEach(item => statusSheet.addRow({ name: item.name, value: item.value }))

  const deliverersSheet = workbook.addWorksheet('Domiciliarios')
  deliverersSheet.columns = [
    { header: 'Nombre', key: 'name', width: 25 },
    { header: 'Pedidos Entregados', key: 'orders', width: 20 },
  ]
  data.deliverers.forEach(item => deliverersSheet.addRow({ name: item.name, orders: item.orders }))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Analytics_${new Date().getTime()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
