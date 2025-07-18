// src/components/WorkOrders.tsx
import React, { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore'
import { useLocation } from 'react-router-dom'
import { db } from '../firebase/config';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  Edit,
  Clock,
  User,
  AlertCircle,
  Trash2,
  XCircle,
  Settings,
  DollarSign,
} from 'lucide-react'

/* ─────── دوال مساعدة للتاريخ ─────── */
const fmt = (val: any): string =>
  val
    ? (typeof val === 'string'
        ? new Date(val)
        : val?.seconds
        ? val.toDate()
        : new Date(val)
      ).toLocaleDateString()
    : '—'

const tsToMillis = (val: any): number =>
  typeof val === 'string'
    ? Date.parse(val)
    : val?.seconds
    ? val.seconds * 1000
    : val ?? 0
/* ─────────────────────────────── */

export function WorkOrders() {
  /* ─────────── State ─────────── */
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)

  // حقول النموذج
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [currentPriority, setCurrentPriority] = useState('Medium')
  const [currentStatus, setCurrentStatus] = useState('Pending')
  const [currentDueDate, setCurrentDueDate] = useState('')
  const [currentFacility, setCurrentFacility] = useState('')
  const [currentFloor, setCurrentFloor] = useState('')
  const [currentType, setCurrentType] = useState('')
  const [currentAssignedTo, setCurrentAssignedTo] = useState('')
  const [currentCost, setCurrentCost] = useState('')

  // قوائم ديناميكية
  const [facilitiesList, setFacilitiesList] = useState<any[]>([])
  const [workOrderTypesList, setWorkOrderTypesList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])

  // حوارات إدارة القوائم
  const [isManageFacilitiesOpen, setIsManageFacilitiesOpen] = useState(false)
  const [newFacilityName, setNewFacilityName] = useState('')
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false)
  const [newWorkOrderTypeName, setNewWorkOrderTypeName] = useState('')

  const location = useLocation()
  const [currentFilter, setCurrentFilter] = useState<string | null>(null)

  /* ─────────── جلب البيانات ─────────── */
  const fetchWorkOrders = async () => {
    try {
      const snap = await getDocs(collection(db, 'work_orders'))
      setWorkOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('Error fetching work orders:', e)
    }
  }

  const fetchFacilities = async () => {
    try {
      const snap = await getDocs(collection(db, 'facilities'))
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name }))
      setFacilitiesList(list)
      if (list.length && !list.some(f => f.name === currentFacility))
        setCurrentFacility(list[0].name)
    } catch (e) {
      console.error('Error fetching facilities:', e)
    }
  }

  const fetchWorkOrderTypes = async () => {
    try {
      const snap = await getDocs(collection(db, 'work_order_types'))
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name }))
      setWorkOrderTypesList(list)
      if (list.length && !list.some(t => t.name === currentType))
        setCurrentType(list[0].name)
    } catch (e) {
      console.error('Error fetching types:', e)
    }
  }

  const fetchUsersList = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'))
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name }))
      setUsersList(list)
      if (list.length && !list.some(u => u.name === currentAssignedTo))
        setCurrentAssignedTo(list[0].name)
    } catch (e) {
      console.error('Error fetching users:', e)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
    fetchFacilities()
    fetchWorkOrderTypes()
    fetchUsersList()
  }, [])

  useEffect(() => {
    if (location.state?.filter) setCurrentFilter(location.state.filter)
    else setCurrentFilter(null)
  }, [location.state])

  /* ─────────── CRUD ─────────── */
  const openOrderForm = (order: any = null) => {
    if (order) {
      setEditingOrder(order)
      setCurrentTitle(order.title || '')
      setCurrentDescription(order.description || '')
      setCurrentPriority(order.priority || 'Medium')
      setCurrentStatus(order.status || 'Pending')
      setCurrentDueDate(
        order.dueDate
          ? typeof order.dueDate === 'string'
            ? order.dueDate
            : order.dueDate.seconds
            ? new Date(order.dueDate.seconds * 1000)
                .toISOString()
                .slice(0, 10)
            : ''
          : '',
      )
      setCurrentFacility(order.facility || '')
      setCurrentFloor(order.floor || '')
      setCurrentType(order.type || '')
      setCurrentAssignedTo(order.assignedTo || '')
      setCurrentCost(order.cost ? String(order.cost) : '')
    } else {
      setEditingOrder(null)
      setCurrentTitle('')
      setCurrentDescription('')
      setCurrentPriority('Medium')
      setCurrentStatus('Pending')
      setCurrentDueDate('')
      setCurrentFacility(facilitiesList[0]?.name || '')
      setCurrentFloor('')
      setCurrentType(workOrderTypesList[0]?.name || '')
      setCurrentAssignedTo(usersList[0]?.name || '')
      setCurrentCost('')
    }
    setIsFormOpen(true)
  }

  const closeOrderForm = () => {
    setIsFormOpen(false)
    setEditingOrder(null)
  }

  const handleSaveOrder = async () => {
    if (
      !currentTitle ||
      !currentDueDate ||
      !currentFacility ||
      !currentType ||
      !currentAssignedTo
    ) {
      alert('Please fill all required fields.')
      return
    }

    const data = {
      title: currentTitle,
      description: currentDescription,
      priority: currentPriority,
      status: currentStatus,
      dueDate: currentDueDate,
      facility: currentFacility,
      floor: currentFloor,
      type: currentType,
      assignedTo: currentAssignedTo,
      cost: parseFloat(currentCost) || 0,
      created: editingOrder?.created || new Date().toISOString(),
    }

    try {
      if (editingOrder)
        await updateDoc(doc(db, 'work_orders', editingOrder.id), data)
      else await addDoc(collection(db, 'work_orders'), data)

      closeOrderForm()
      fetchWorkOrders()
    } catch (e) {
      console.error('Error saving work order:', e)
    }
  }

  const handleDeleteOrder = async () => {
    if (
      !editingOrder ||
      !window.confirm(`Delete work order "${editingOrder.title}"?`)
    )
      return
    await deleteDoc(doc(db, 'work_orders', editingOrder.id))
    closeOrderForm()
    fetchWorkOrders()
  }

  /* ─────────── إدارة Facilities / Types ─────────── */
  const handleAddFacility = async () => {
    const name = newFacilityName.trim()
    if (!name) return
    if (facilitiesList.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      alert('Facility already exists.')
      return
    }
    await addDoc(collection(db, 'facilities'), { name })
    setNewFacilityName('')
    fetchFacilities()
  }

  const handleDeleteFacility = async (id: string) => {
    if (!window.confirm('Delete this facility?')) return
    await deleteDoc(doc(db, 'facilities', id))
    fetchFacilities()
  }

  const handleAddWorkOrderType = async () => {
    const name = newWorkOrderTypeName.trim()
    if (!name) return
    if (
      workOrderTypesList.some(
        t => t.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      alert('Type already exists.')
      return
    }
    await addDoc(collection(db, 'work_order_types'), { name })
    setNewWorkOrderTypeName('')
    fetchWorkOrderTypes()
  }

  const handleDeleteWorkOrderType = async (id: string) => {
    if (!window.confirm('Delete this type?')) return
    await deleteDoc(doc(db, 'work_order_types', id))
    fetchWorkOrderTypes()
  }

  /* ─────────── Utils للألوان ─────────── */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Scheduled':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-orange-100 text-orange-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  /* ─────────── فلترة للـ Dashboard ─────────── */
  const filteredWorkOrders = workOrders.filter(order => {
    if (!currentFilter) return true
    switch (currentFilter) {
      case 'Open':
        return ['Pending', 'In Progress', 'Scheduled'].includes(order.status)
      case 'Completed':
        return order.status === 'Completed'
      case 'In Progress':
        return order.status === 'In Progress'
      case 'Scheduled':
        return order.status === 'Scheduled'
      case 'Overdue':
        return order.status !== 'Completed' && tsToMillis(order.dueDate) < Date.now()
      default:
        return true
    }
  })

  /* ─────────── JSX ─────────── */
  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-gray-500">Manage maintenance tasks and requests</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openOrderForm()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
          <Button variant="outline" onClick={() => setIsManageFacilitiesOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Manage Facilities
          </Button>
          <Button variant="outline" onClick={() => setIsManageTypesOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Manage Types
          </Button>
        </div>
      </div>

      {/* نموذج إنشاء / تعديل أمر عمل */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Edit Work Order' : 'Create New Work Order'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Work Order Title</Label>
              <Input
                id="title"
                placeholder="Work Order Title"
                value={currentTitle}
                onChange={e => setCurrentTitle(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Work Order Description</Label>
              <Input
                id="description"
                placeholder="Work Order Description"
                value={currentDescription}
                onChange={e => setCurrentDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={currentPriority} onValueChange={setCurrentPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={currentDueDate}
                onChange={e => setCurrentDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cost">Estimated Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cost"
                  type="number"
                  className="pl-8"
                  placeholder="0.00"
                  value={currentCost}
                  onChange={e => setCurrentCost(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="facility">Facility</Label>
              <Select value={currentFacility} onValueChange={setCurrentFacility}>
                <SelectTrigger id="facility">
                  <SelectValue placeholder="Facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilitiesList.map(f => (
                    <SelectItem key={f.id} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="floor">Floor (optional)</Label>
              <Input
                id="floor"
                placeholder="e.g., 2nd Floor"
                value={currentFloor}
                onChange={e => setCurrentFloor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={currentType} onValueChange={setCurrentType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {workOrderTypesList.map(t => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={currentAssignedTo}
                onValueChange={setCurrentAssignedTo}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  {usersList.map(u => (
                    <SelectItem key={u.id} value={u.name}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between w-full">
            <div>
              {editingOrder && (
                <Button variant="destructive" onClick={handleDeleteOrder}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeOrderForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveOrder}>
                {editingOrder ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* شريط البحث + البطاقات العلوية */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" placeholder="Search work orders..." />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredWorkOrders.length}
              </div>
              <p className="text-sm text-gray-500">
                {currentFilter ? `Filtered: ${currentFilter}` : 'Total Orders'}
                {currentFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFilter(null)}
                    className="ml-2 p-1 h-auto"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بطاقات أوامر العمل */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWorkOrders.length ? (
          filteredWorkOrders.map(order => (
            <Card
              key={order.id}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{order.title}</CardTitle>
                    <p className="text-sm text-gray-500">{order.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Facility:</span>
                    <span className="font-medium">
                      {order.facility}
                      {order.floor && ` - ${order.floor}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{order.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.assignedTo}
                    </span>
                  </div>
                  <div className="pt-2 border-t text-xs text-gray-500 flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created: {fmt(order.created)}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-4 text-orange-500" />
                      Due: {fmt(order.dueDate)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openOrderForm(order)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Manage Order
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            {currentFilter
              ? `No work orders with status "${currentFilter}".`
              : 'Loading or none available.'}
          </p>
        )}
      </div>

      {/* إحصائيات */}
      <Card>
        <CardHeader>
          <CardTitle>Work Order Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat
              count={workOrders.filter(o =>
                ['Pending', 'In Progress', 'Scheduled'].includes(o.status),
              ).length}
              label="Open"
              color="text-blue-600"
            />
            <Stat
              count={workOrders.filter(o => o.status === 'Completed').length}
              label="Completed"
              color="text-green-600"
            />
            <Stat
              count={workOrders.filter(o => o.status === 'In Progress').length}
              label="In Progress"
              color="text-yellow-600"
            />
            <Stat
              count={workOrders.filter(o => o.status === 'Scheduled').length}
              label="Scheduled"
              color="text-purple-600"
            />
            <Stat
              count={workOrders.filter(
                o =>
                  o.status !== 'Completed' &&
                  tsToMillis(o.dueDate) < Date.now(),
              ).length}
              label="Overdue"
              color="text-red-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog إدارة Facilities */}
      <Dialog
        open={isManageFacilitiesOpen}
        onOpenChange={setIsManageFacilitiesOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Facilities</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Add New Facility</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="New Facility Name (e.g., Building D)"
                  value={newFacilityName}
                  onChange={e => setNewFacilityName(e.target.value)}
                />
                <Button onClick={handleAddFacility}>Add</Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Facilities</h3>
              <ul className="space-y-2">
                {facilitiesList.length ? (
                  facilitiesList.map(f => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span>{f.name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFacility(f.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No facilities defined yet.</p>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManageFacilitiesOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إدارة Types */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Work Order Types</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Add New Type</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="New Type Name (e.g., Plumbing)"
                  value={newWorkOrderTypeName}
                  onChange={e => setNewWorkOrderTypeName(e.target.value)}
                />
                <Button onClick={handleAddWorkOrderType}>Add</Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Types</h3>
              <ul className="space-y-2">
                {workOrderTypesList.length ? (
                  workOrderTypesList.map(t => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span>{t.name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteWorkOrderType(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No types defined yet.</p>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManageTypesOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* مكوّن صغير للإحصائيات */
type StatProps = { count: number; label: string; color: string }
const Stat = ({ count, label, color }: StatProps) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${color}`}>{count}</div>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
)
