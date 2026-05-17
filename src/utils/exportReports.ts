import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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

export const exportPerformancePDF = (
  delivererName: string,
  period: string,
  metrics: PerformanceMetrics,
  zones: Zone[]
) => {
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

  autoTable(doc, {
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

  autoTable(doc, {
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

export const exportPerformanceExcel = (
  delivererName: string,
  period: string,
  metrics: PerformanceMetrics,
  zones: Zone[]
) => {
  const workbook = XLSX.utils.book_new()

  const metricsSheet = [
    ['Reporte de Desempeño', delivererName],
    ['Período', period],
    ['Fecha de generación', new Date().toLocaleDateString('es-CO')],
    [],
    ['Métrica', 'Valor'],
    ['Distancia recorrida (km)', metrics.kmTraveled],
    ['Tiempo activo (horas)', metrics.activeHours],
    ['Tiempo activo (minutos)', metrics.activeMinutes],
    ['Zonas visitadas', metrics.zonesVisited],
    ['Hora pico', metrics.peakHour],
  ]

  const zonesSheet = [
    ['Top Zonas Visitadas'],
    ['Latitud', 'Longitud', 'Cantidad de visitas'],
    ...zones.slice(0, 20).map(z => [z.latitude, z.longitude, z.visitCount]),
  ]

  XLSX.utils.sheet_add_aoa(workbook.Sheets['Métricas'] || (workbook.Sheets['Métricas'] = {}), metricsSheet)
  XLSX.utils.sheet_add_aoa(workbook.Sheets['Zonas'] || (workbook.Sheets['Zonas'] = {}), zonesSheet)

  const metricaWS = XLSX.utils.aoa_to_sheet(metricsSheet)
  const zonasWS = XLSX.utils.aoa_to_sheet(zonesSheet)

  metricaWS['!cols'] = [{ wch: 25 }, { wch: 15 }]
  zonasWS['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }]

  workbook.SheetNames = ['Métricas', 'Zonas']
  workbook.Sheets['Métricas'] = metricaWS
  workbook.Sheets['Zonas'] = zonasWS

  XLSX.writeFile(workbook, `Reporte_${delivererName}_${new Date().getTime()}.xlsx`)
}

export interface AnalyticsData {
  hourly: Array<{ hour: string; count: number }>
  status: Array<{ name: string; value: number }>
  deliverers: Array<{ name: string; orders: number }>
}

export const exportAnalyticsExcel = (data: AnalyticsData) => {
  const workbook = XLSX.utils.book_new()

  const hourlySheet = [
    ['Actividad por Hora'],
    ['Hora', 'Cantidad de Pedidos'],
    ...data.hourly.map(h => [h.hour, h.count]),
  ]

  const statusSheet = [
    ['Distribución por Estado'],
    ['Estado', 'Cantidad'],
    ...data.status.map(s => [s.name, s.value]),
  ]

  const deliverersSheet = [
    ['Rendimiento por Domiciliario'],
    ['Nombre', 'Pedidos Entregados'],
    ...data.deliverers.map(d => [d.name, d.orders]),
  ]

  const hourlyWS = XLSX.utils.aoa_to_sheet(hourlySheet)
  const statusWS = XLSX.utils.aoa_to_sheet(statusSheet)
  const deliverersWS = XLSX.utils.aoa_to_sheet(deliverersSheet)

  hourlyWS['!cols'] = [{ wch: 15 }, { wch: 20 }]
  statusWS['!cols'] = [{ wch: 20 }, { wch: 15 }]
  deliverersWS['!cols'] = [{ wch: 25 }, { wch: 20 }]

  workbook.SheetNames = ['Actividad Horaria', 'Estados', 'Domiciliarios']
  workbook.Sheets['Actividad Horaria'] = hourlyWS
  workbook.Sheets['Estados'] = statusWS
  workbook.Sheets['Domiciliarios'] = deliverersWS

  XLSX.writeFile(workbook, `Analytics_${new Date().getTime()}.xlsx`)
}
