'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, CheckCircle2, XCircle, FileText, BarChart2, ShieldCheck, History, X, Lock, Eye, Key, Clock, Database, Server, Code, Users, HelpCircle, FileIcon as FilePdf, PieChartIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { fetchAssets, fetchThreats, fetchAssessments, addAsset as addAssetDB, addThreat as addThreatDB, addAssessment as addAssessmentDB } from "@/app/actions/fetch"
import { logoutUser } from "@/app/actions/userActions"
type Asset = {
  id: number
  code: string
  name: string
  type: string
  value: number
  authenticity: number
  confidentiality: number
  integrity: number
  availability: number
  traceability: number
}

type Threat = {
  id: number
  code: string
  name: string
  group: string
  frequency: string
  frequencyValue: number
  affectedDimensions: string[]
  affectedTypes: string[]
}

type Assessment = {
  id: number
  assetId: number
  threatId: number
  impact: string
  impactValue: number
  controlEffectiveness: number
  intrinsicRisk: number
  residualRisk: number
  date: string
}

type Notification = {
  id: number
  message: string
  type: "success" | "error" | "info"
}

export default function MAGERITAssessment() {
  const logoutHandler = async () => {
    const result = await logoutUser()
    if (result.success) {
      window.location.reload()
    }
  }
  const [assets, setAssets] = useState<Asset[]>([])
  const [threats, setThreats] = useState<Threat[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [newAsset, setNewAsset] = useState({
    code: "",
    name: "",
    type: "",
    value: 100000,
    authenticity: 0,
    confidentiality: 0,
    integrity: 0,
    availability: 0,
    traceability: 0,
  })
  const [newThreat, setNewThreat] = useState({
    code: "",
    name: "",
    group: "",
    frequency: "",
    frequencyValue: 0,
    affectedDimensions: [] as string[],
    affectedTypes: [] as string[],
  })
  const [selectedAsset, setSelectedAsset] = useState<string>("")
  const [selectedThreat, setSelectedThreat] = useState<string>("")
  const [selectedImpact, setSelectedImpact] = useState<string>("")
  const [controlEffectiveness, setControlEffectiveness] = useState<number>(0)
  const [selectedTab, setSelectedTab] = useState("assets")

  const menuItems = [
    { value: "assets", label: "Activos", icon: ShieldCheck, description: "Gestionar activos y recursos" },
    { value: "threats", label: "Amenazas", icon: AlertCircle, description: "Identificar amenazas potenciales" },
    { value: "assessment", label: "Evaluación", icon: BarChart2, description: "Análisis y evaluación de riesgos" },
    { value: "reports", label: "Informes", icon: FileText, description: "Reportes y documentación" },
    { value: "charts", label: "Gráficos", icon: PieChartIcon, description: "Visualización de datos" },
  ]

  const assetTypes = [
    { value: "hardware", label: "Hardware" },
    { value: "software", label: "Software" },
    { value: "datos", label: "Datos" },
    { value: "servicios", label: "Servicios" },
    { value: "personal", label: "Personal" },
  ]

  const threatGroups = [
    { value: "natural", label: "Desastres naturales" },
    { value: "industrial", label: "Origen industrial" },
    { value: "error", label: "Errores y fallos no intencionados" },
    { value: "ataque", label: "Ataques intencionados" },
  ]

  const frequencies = [
    { value: "FMA", label: "Muy Alta", numericValue: 1.0 },
    { value: "FA", label: "Alta", numericValue: 0.071 },
    { value: "FM", label: "Media", numericValue: 0.016 },
    { value: "FB", label: "Baja", numericValue: 0.0016 },
    { value: "FMB", label: "Muy Baja", numericValue: 0.00016 },
  ]

  const impactLevels = [
    { value: "MA", label: "Muy Alto", percentage: 100 },
    { value: "A", label: "Alto", percentage: 75 },
    { value: "M", label: "Medio", percentage: 50 },
    { value: "B", label: "Bajo", percentage: 25 },
    { value: "MB", label: "Muy Bajo", percentage: 10 },
  ]

  const dimensionInfo = {
    A: { icon: <Key className="w-4 h-4" />, label: "Autenticidad", description: "Propiedad o característica consistente en que una entidad es quien dice ser o bien que garantiza la fuente de la que proceden los datos" },
    C: { icon: <Lock className="w-4 h-4" />, label: "Confidencialidad", description: "Propiedad o característica consistente en que la información ni se pone a disposición, ni se revela a individuos, entidades o procesos no autorizados" },
    I: { icon: <ShieldCheck className="w-4 h-4" />, label: "Integridad", description: "Propiedad o característica consistente en que el activo de información no ha sido alterado de manera no autorizada" },
    D: { icon: <Clock className="w-4 h-4" />, label: "Disponibilidad", description: "Propiedad o característica de los activos consistente en que las entidades o procesos autorizados tienen acceso a los mismos cuando lo requieren" },
    T: { icon: <Eye className="w-4 h-4" />, label: "Trazabilidad", description: "Propiedad o característica consistente en que las actuaciones de una entidad pueden ser imputadas exclusivamente a dicha entidad" },
  }

  const assetTypeInfo = {
    H: { icon: <Server className="w-4 h-4" />, label: "Hardware", description: "Activos físicos, equipamiento informático" },
    S: { icon: <Code className="w-4 h-4" />, label: "Software", description: "Aplicaciones, sistemas operativos" },
    D: { icon: <Database className="w-4 h-4" />, label: "Datos", description: "Información almacenada" },
    P: { icon: <Users className="w-4 h-4" />, label: "Personal", description: "Usuarios, operadores y administradores del sistema" },
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const addNotification = (message: string, type: "success" | "error" | "info") => {
    const newNotification = { id: Date.now(), message, type }
    setNotifications((prev) => [...prev, newNotification])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id))
    }, 5000)
  }

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const convertAssetToDBFormat = (asset: typeof newAsset) => ({
    ...asset,
    value: asset.value.toString(),
    authenticity: asset.authenticity.toString(),
    confidentiality: asset.confidentiality.toString(),
    integrity: asset.integrity.toString(),
    availability: asset.availability.toString(),
    traceability: asset.traceability.toString(),
  })

  const addAsset = async () => {
    if (newAsset.code && newAsset.name && newAsset.type) {
      const response = await addAssetDB(convertAssetToDBFormat(newAsset))
      if (response.success) {
        setAssets([...assets, { ...newAsset, id: response.id }])
        setNewAsset({
          code: "",
          name: "",
          type: "",
          value: 100000,
          authenticity: 0,
          confidentiality: 0,
          integrity: 0,
          availability: 0,
          traceability: 0,
        })
        addNotification("Activo añadido con éxito", "success")
      } else {
        addNotification(response.error || "Error al añadir activo", "error")
      }
    } else {
      addNotification("Por favor, complete todos los campos requeridos", "error")
    }
  }

  const convertThreatToDBFormat = (threat: typeof newThreat) => ({
    ...threat,
    frequencyValue: threat.frequencyValue.toString(),
  })

  const addThreat = async () => {
    if (newThreat.code && newThreat.name && newThreat.group && newThreat.frequency) {
      const response = await addThreatDB(convertThreatToDBFormat(newThreat))
      if (response.success) {
        setThreats([...threats, { ...newThreat, id: response.id }])
        setNewThreat({
          code: "",
          name: "",
          group: "",
          frequency: "",
          frequencyValue: 0,
          affectedDimensions: [],
          affectedTypes: [],
        })
        addNotification("Amenaza añadida con éxito", "success")
      } else {
        addNotification(response.error || "Error al añadir amenaza", "error")
      }
    } else {
      addNotification("Por favor, complete todos los campos requeridos", "error")
    }
  }

  const convertAssessmentToDBFormat = (assessment: Assessment) => ({
    ...assessment,
    assetId: assessment.assetId.toString(),
    threatId: assessment.threatId.toString(),
    intrinsicRisk: assessment.intrinsicRisk.toString(),
    residualRisk: assessment.residualRisk.toString(),
    impactValue: assessment.impactValue.toString(),
    controlEffectiveness: assessment.controlEffectiveness.toString(),
  })

  const addAssessment = async () => {
    const asset = assets.find((a) => a.code === selectedAsset)
    const threat = threats.find((t) => t.code === selectedThreat)
    if (asset && threat && selectedImpact) {
      const impactValue = impactLevels.find((i) => i.value === selectedImpact)?.percentage || 0
      const { intrinsicRisk, residualRisk } = calculateRisks(asset, threat, impactValue)

      const newAssessment = {
        id: Date.now(),
        assetId: asset.id,
        threatId: threat.id,
        impact: selectedImpact,
        impactValue,
        controlEffectiveness,
        intrinsicRisk,
        residualRisk,
        date: format(new Date(), "yyyy-MM-dd", { locale: es }),
      }
      
      const response = await addAssessmentDB(convertAssessmentToDBFormat(newAssessment))
      if (response.success) {
        setAssessments([...assessments, { ...newAssessment, id: response.id }])
        setSelectedAsset("")
        setSelectedThreat("")
        setSelectedImpact("")
        setControlEffectiveness(0)
        addNotification("Evaluación de riesgo añadida con éxito", "success")
      } else {
        addNotification(response.error || "Error al añadir evaluación", "error")
      }
    } else {
      addNotification("Por favor, seleccione un activo, una amenaza y un impacto", "error")
    }
  }

  const calculateRisks = (asset: Asset, threat: Threat, impactPercentage: number) => {
    const intrinsicRisk = asset.value * threat.frequencyValue * (impactPercentage / 100)
    const residualRisk = intrinsicRisk * (1 - controlEffectiveness / 100)
    return { intrinsicRisk, residualRisk }
  }

  const getRiskColor = (risk: number) => {
    if (risk < 1000000) return "text-green-500"
    if (risk < 5000000) return "text-yellow-500"
    if (risk < 10000000) return "text-orange-500"
    return "text-red-500"
  }

  const getRiskIcon = (risk: number) => {
    if (risk < 1000000) return <CheckCircle2 className="inline mr-2" />
    if (risk < 5000000) return <AlertCircle className="inline mr-2" />
    if (risk < 10000000) return <AlertCircle className="inline mr-2" />
    return <XCircle className="inline mr-2" />
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("Informe de Evaluación de Riesgos MAGERIT", 20, 20)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)

    let yPos = 40
    assessments.forEach((assessment) => {
      const asset = assets.find((a) => a.id === assessment.assetId)
      const threat = threats.find((t) => t.id === assessment.threatId)

      doc.text(`Fecha: ${assessment.date}`, 20, yPos)
      doc.text(`Activo: ${asset?.name} (${asset?.code})`, 20, yPos + 10)
      doc.text(`Amenaza: ${threat?.name} (${threat?.code})`, 20, yPos + 20)
      doc.text(`Impacto: ${impactLevels.find((i) => i.value === assessment.impact)?.label}`, 20, yPos + 30)
      doc.text(`Riesgo Intrínseco: ${formatCurrency(assessment.intrinsicRisk)}`, 20, yPos + 40)
      doc.text(`Efectividad del Control: ${assessment.controlEffectiveness}%`, 20, yPos + 50)
      doc.text(`Riesgo Residual: ${formatCurrency(assessment.residualRisk)}`, 20, yPos + 60)

      yPos += 80

      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
    })

    doc.save("informe_evaluacion_riesgos_magerit.pdf")
    addNotification("Informe PDF descargado con éxito", "success")
  }

  useEffect(() => {
    async function loadData() {
      try {
        const assetsResponse = await fetchAssets()
        const threatsResponse = await fetchThreats()
        const assessmentsResponse = await fetchAssessments()

        if (assetsResponse.success && threatsResponse.success && assessmentsResponse.success) {
          setAssets(assetsResponse.assets as Asset[])
          setAssessments(assessmentsResponse.assessments as Assessment[])
          setThreats(threatsResponse.threats as Threat[])
        } else {
          addNotification(assetsResponse.error || threatsResponse.error || assessmentsResponse.error || "Failed to load data", "error")
        }
      } catch (error) {
        addNotification("An unexpected error occurred", "error")
        console.error("Data loading error:", error)
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <TooltipProvider>
        <header className="bg-primary text-primary-foreground p-4 shadow-md">
          <h1 className="text-3xl font-bold text-center">Herramienta de Evaluación de Riesgos MAGERIT</h1>
          <div className="absolute top-0 right-0 p-2">
            <Button variant="destructive" size="sm" onClick={logoutHandler}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 relative">
          <div className="fixed top-4 right-4 z-50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`mb-2 p-4 rounded-md shadow-md flex justify-between items-center ${
                  notification.type === "success"
                    ? "bg-green-500"
                    : notification.type === "error"
                    ? "bg-red-500"
                    : "bg-blue-500"
                } text-white`}
              >
                <span>{notification.message}</span>
                <button onClick={() => removeNotification(notification.id)} className="ml-2 text-white hover:text-gray-200">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <Tabs defaultValue="assets" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                {/* Versión Móvil */}
                <div className="sm:hidden">
                  <Select value={selectedTab} onValueChange={setSelectedTab}>
                    <SelectTrigger className="w-full bg-white border shadow-sm">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const item = menuItems.find((item) => item.value === selectedTab)
                            const Icon = item?.icon
                            return Icon && <Icon className="w-6 h-6 text-primary" />
                          })()}
                          <span className="text-base font-medium capitalize">
                            {menuItems.find((item) => item.value === selectedTab)?.label}
                          </span>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="w-[calc(100vw-2rem)] mx-4 bg-white border shadow-lg rounded-lg" align="center">
                      {menuItems.map(({ value, label, icon: Icon, description }) => (
                        <SelectItem key={value} value={value} className="border-b last:border-b-0">
                          <div className="flex items-start gap-3 py-3 px-3">
                            <Icon className="w-6 h-6 text-primary mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-base font-medium">{label}</span>
                              <span className="text-sm text-muted-foreground">{description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Versión Desktop */}
                <div className="hidden sm:block">
                  <div className="flex flex-col items-center justify-center">
                    <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
                      {menuItems.map(({ value, label, icon: Icon }) => (
                        <TabsTrigger key={value} value={value} className="data-[state=active]:bg-background">
                          <Icon className="w-4 h-4 mr-2" />
                          {label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="assets">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Gestión de Activos
                      </CardTitle>
                      <CardDescription>Añada y gestione sus activos de información</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="assetCode">Código del Activo</Label>
                          <Input
                            id="assetCode"
                            value={newAsset.code}
                            onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })}
                            placeholder="Ingrese el código"
                          />
                        </div>
                        <div>
                          <Label htmlFor="assetName">Nombre del Activo</Label>
                          <Input
                            id="assetName"
                            value={newAsset.name}
                            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                            placeholder="Ingrese el nombre"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="assetType">Tipo de Activo</Label>
                          <Select value={newAsset.type} onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {assetTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="assetValue">Valor (COP)</Label>
                          <Input
                            id="assetValue"
                            type="number"
                            value={newAsset.value}
                            onChange={(e) => setNewAsset({ ...newAsset, value: Number(e.target.value) })}
                            placeholder="Ingrese el valor"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <Label htmlFor="authenticity">Autenticidad</Label>
                          <Input
                            id="authenticity"
                            type="number"
                            min="0"
                            max="5"
                            value={newAsset.authenticity}
                            onChange={(e) => setNewAsset({ ...newAsset, authenticity: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confidentiality">Confidencialidad</Label>
                          <Input
                            id="confidentiality"
                            type="number"
                            min="0"
                            max="5"
                            value={newAsset.confidentiality}
                            onChange={(e) => setNewAsset({ ...newAsset, confidentiality: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="integrity">Integridad</Label>
                          <Input
                            id="integrity"
                            type="number"
                            min="0"
                            max="5"
                            value={newAsset.integrity}
                            onChange={(e) => setNewAsset({ ...newAsset, integrity: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="availability">Disponibilidad</Label>
                          <Input
                            id="availability"
                            type="number"
                            min="0"
                            max="5"
                            value={newAsset.availability}
                            onChange={(e) => setNewAsset({ ...newAsset, availability: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="traceability">Trazabilidad</Label>
                          <Input
                            id="traceability"
                            type="number"
                            min="0"
                            max="5"
                            value={newAsset.traceability}
                            onChange={(e) => setNewAsset({ ...newAsset, traceability: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <Button onClick={addAsset} className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Añadir Activo
                      </Button>

                      <div className="overflow-x-auto">
                        <Table className="mt-8">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Valoración</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assets.map((asset) => (
                              <TableRow key={asset.id}>
                                <TableCell>{asset.code}</TableCell>
                                <TableCell>{asset.name}</TableCell>
                                <TableCell>{assetTypes.find((t) => t.value === asset.type)?.label}</TableCell>
                                <TableCell>{formatCurrency(asset.value)}</TableCell>
                                <TableCell>
                                  {((asset.authenticity + asset.confidentiality + asset.integrity + asset.availability + asset.traceability) / 5).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="threats">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Gestión de Amenazas
                      </CardTitle>
                      <CardDescription>Identifique y evalúe las amenazas potenciales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="threatCode">Código de Amenaza</Label>
                          <Input
                            id="threatCode"
                            value={newThreat.code}
                            onChange={(e) => setNewThreat({ ...newThreat, code: e.target.value })}
                            placeholder="Ingrese el código"
                          />
                        </div>
                        <div>
                          <Label htmlFor="threatName">Nombre de Amenaza</Label>
                          <Input
                            id="threatName"
                            value={newThreat.name}
                            onChange={(e) => setNewThreat({ ...newThreat, name: e.target.value })}
                            placeholder="Ingrese el nombre"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="threatGroup">Grupo de Amenaza</Label>
                          <Select value={newThreat.group} onValueChange={(value) => setNewThreat({ ...newThreat, group: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              {threatGroups.map((group) => (
                                <SelectItem key={group.value} value={group.value}>
                                  {group.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="frequency">Frecuencia</Label>
                          <Select
                            value={newThreat.frequency}
                            onValueChange={(value) => {
                              const frequencyObj = frequencies.find((f) => f.value === value)
                              setNewThreat({
                                ...newThreat,
                                frequency: value,
                                frequencyValue: frequencyObj ? frequencyObj.numericValue : 0,
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione frecuencia" />
                            </SelectTrigger>
                            <SelectContent>
                              {frequencies.map((freq) => (
                                <SelectItem key={freq.value} value={freq.value}>
                                  {freq.label} ({freq.numericValue})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="mb-2 block flex items-center gap-2">
                            Dimensiones Afectadas
                            <UITooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-4 h-4" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Seleccione las dimensiones de seguridad afectadas por la amenaza</p>
                              </TooltipContent>
                            </UITooltip>
                          </Label>
                          <div className="flex gap-4 flex-wrap">
                            {Object.entries(dimensionInfo).map(([key, info]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`dim-${key.toLowerCase()}`}
                                        checked={newThreat.affectedDimensions.includes(key)}
                                        onCheckedChange={(checked) => {
                                          const dims = checked
                                            ? [...newThreat.affectedDimensions, key]
                                            : newThreat.affectedDimensions.filter((d) => d !== key)
                                          setNewThreat({ ...newThreat, affectedDimensions: dims })
                                        }}
                                      />
                                      <label htmlFor={`dim-${key.toLowerCase()}`} className="flex items-center gap-1">
                                        {info.icon}
                                        {key}
                                      </label>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{info.label}</p>
                                    <p className="max-w-xs text-sm">{info.description}</p>
                                  </TooltipContent>
                                </UITooltip>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="mb-2 block flex items-center gap-2">
                            Tipos de Activos Afectados
                            <UITooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-4 h-4" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Seleccione los tipos de activos afectados por la amenaza</p>
                              </TooltipContent>
                            </UITooltip>
                          </Label>
                          <div className="flex gap-4 flex-wrap">
                            {Object.entries(assetTypeInfo).map(([key, info]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`type-${key.toLowerCase()}`}
                                        checked={newThreat.affectedTypes.includes(key)}
                                        onCheckedChange={(checked) => {
                                          const types = checked
                                            ? [...newThreat.affectedTypes, key]
                                            : newThreat.affectedTypes.filter((t) => t !== key)
                                          setNewThreat({ ...newThreat, affectedTypes: types })
                                        }}
                                      />
                                      <label htmlFor={`type-${key.toLowerCase()}`} className="flex items-center gap-1">
                                        {info.icon}
                                        {key}
                                      </label>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{info.label}</p>
                                    <p className="max-w-xs text-sm">{info.description}</p>
                                  </TooltipContent>
                                </UITooltip>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button onClick={addThreat} className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Añadir Amenaza
                      </Button>

                      <div className="overflow-x-auto">
                        <Table className="mt-8">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Grupo</TableHead>
                              <TableHead>Frecuencia</TableHead>
                              <TableHead>Dimensiones</TableHead>
                              <TableHead>Tipos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {threats.map((threat) => (
                              <TableRow key={threat.id}>
                                <TableCell>{threat.code}</TableCell>
                                <TableCell>{threat.name}</TableCell>
                                <TableCell>{threatGroups.find((g) => g.value === threat.group)?.label}</TableCell>
                                <TableCell>
                                  {frequencies.find((f) => f.value === threat.frequency)?.label} ({threat.frequencyValue})
                                </TableCell>
                                <TableCell>{threat.affectedDimensions.join(", ")}</TableCell>
                                <TableCell>{threat.affectedTypes.join(", ")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assessment">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        Matriz de Evaluación de Riesgos
                      </CardTitle>
                      <CardDescription>Evalúe los riesgos basados en activos y amenazas según metodología MAGERIT</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label htmlFor="assessmentAsset">Activo</Label>
                          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione activo" />
                            </SelectTrigger>
                            <SelectContent>
                              {assets.map((asset) => (
                                <SelectItem key={asset.code} value={asset.code}>
                                  {asset.name} ({formatCurrency(asset.value)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="assessmentThreat">Amenaza</Label>
                          <Select value={selectedThreat} onValueChange={setSelectedThreat}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione amenaza" />
                            </SelectTrigger>
                            <SelectContent>
                              {threats.map((threat) => (
                                <SelectItem key={threat.code} value={threat.code}>
                                  {threat.name} ({threat.frequency})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="impact">Impacto</Label>
                          <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione impacto" />
                            </SelectTrigger>
                            <SelectContent>
                              {impactLevels.map((impact) => (
                                <SelectItem key={impact.value} value={impact.value}>
                                  {impact.label} ({impact.percentage}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label htmlFor="controlEffectiveness" className="mb-2 block">
                          Efectividad del Control (%)
                        </Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            id="controlEffectiveness"
                            min={0}
                            max={100}
                            step={1}
                            value={[controlEffectiveness]}
                            onValueChange={(value) => setControlEffectiveness(value[0])}
                            className="flex-grow"
                          />
                          <span className="w-12 text-center">{controlEffectiveness}%</span>
                        </div>
                      </div>

                      <Button onClick={addAssessment} className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        Añadir Evaluación
                      </Button>

                      <div className="overflow-x-auto">
                        <Table className="mt-8">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Activo</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Amenaza</TableHead>
                              <TableHead>Frecuencia</TableHead>
                              <TableHead>Impacto</TableHead>
                              <TableHead>Riesgo Intrínseco</TableHead>
                              <TableHead>Efectividad Control</TableHead>
                              <TableHead>Riesgo Residual</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessments.map((assessment) => {
                              const asset = assets.find((a) => a.id === assessment.assetId)
                              const threat = threats.find((t) => t.id === assessment.threatId)
                              return (
                                <TableRow key={assessment.id}>
                                  <TableCell>{asset?.name}</TableCell>
                                  <TableCell>{formatCurrency(asset?.value || 0)}</TableCell>
                                  <TableCell>{threat?.name}</TableCell>
                                  <TableCell>
                                    {threat?.frequency}
                                  </TableCell>
                                  <TableCell>
                                    {impactLevels.find((i) => i.value === assessment.impact)?.label} ({assessment.impactValue}%)
                                  </TableCell>
                                  <TableCell className={getRiskColor(assessment.intrinsicRisk)}>
                                    {getRiskIcon(assessment.intrinsicRisk)}
                                    {formatCurrency(assessment.intrinsicRisk)}
                                  </TableCell>
                                  <TableCell>{assessment.controlEffectiveness}%</TableCell>
                                  <TableCell className={getRiskColor(assessment.residualRisk)}>
                                    {getRiskIcon(assessment.residualRisk)}
                                    {formatCurrency(assessment.residualRisk)}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Informes Detallados
                      </CardTitle>
                      <CardDescription>Genere y descargue informes de sus evaluaciones de riesgo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={generatePDF} className="flex items-center gap-2">
                        <FilePdf className="w-4 h-4" />
                        Descargar Informe PDF
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="charts">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Visualización de Riesgos
                      </CardTitle>
                      <CardDescription>Gráficos avanzados para la visualización de datos de riesgo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Riesgo Intrínseco vs Residual</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={assessments}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="intrinsicRisk" fill="#8884d8" name="Riesgo Intrínseco" />
                              <Bar dataKey="residualRisk" fill="#82ca9d" name="Riesgo Residual" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Distribución de Riesgos</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Bajo", value: assessments.filter((a) => a.residualRisk < 1000000).length },
                                  {
                                    name: "Medio",
                                    value: assessments.filter((a) => a.residualRisk >= 1000000 && a.residualRisk < 5000000).length,
                                  },
                                  {
                                    name: "Alto",
                                    value: assessments.filter((a) => a.residualRisk >= 5000000 && a.residualRisk < 10000000).length,
                                  },
                                  { name: "Crítico", value: assessments.filter((a) => a.residualRisk >= 10000000).length },
                                ]}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label
                              >
                                <Cell fill="#4caf50" />
                                <Cell fill="#ffeb3b" />
                                <Cell fill="#ff9800" />
                                <Cell fill="#f44336" />
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Historial de Evaluaciones
                      </CardTitle>
                      <CardDescription>Siga la evolución de sus evaluaciones de riesgo a lo largo del tiempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Activo</TableHead>
                              <TableHead>Amenaza</TableHead>
                              <TableHead>Riesgo Intrínseco</TableHead>
                              <TableHead>Riesgo Residual</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessments.map((assessment) => {
                              const asset = assets.find((a) => a.id === assessment.assetId)
                              const threat = threats.find((t) => t.id === assessment.threatId)
                              return (
                                <TableRow key={assessment.id}>
                                  <TableCell>{assessment.date}</TableCell>
                                  <TableCell>{asset?.name}</TableCell>
                                  <TableCell>{threat?.name}</TableCell>
                                  <TableCell className={getRiskColor(assessment.intrinsicRisk)}>
                                    {getRiskIcon(assessment.intrinsicRisk)}
                                    {formatCurrency(assessment.intrinsicRisk)}
                                  </TableCell>
                                  <TableCell className={getRiskColor(assessment.residualRisk)}>
                                    {getRiskIcon(assessment.residualRisk)}
                                    {formatCurrency(assessment.residualRisk)}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>&copy; 2024 MAGERIT Risk Assessment Tool. Todos los derechos reservados.</p>
          </div>
        </footer>
      </TooltipProvider>
    </div>
  )
}