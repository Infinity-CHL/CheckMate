import { useEffect, useMemo, useState } from 'react'
import Avatar from 'boring-avatars'

import { AppLoader } from '@/components/AppLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EMPLOYEE_GRADES,
  EMPLOYEE_ROLES,
  getEmployees,
  updateEmployee,
  type Employee,
  type EmployeeGrade,
  type EmployeeRole,
} from '@/features/admin/api/employeesApi'
import { useAuth } from '@/features/auth/useAuth'

const avatarColors = ['#2f3a2f', '#7a4f2b', '#d8a15d', '#f2dfb3', '#9f5f36']

const roleLabels: Record<EmployeeRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  waiter: 'Официант',
}

const gradeLabels: Record<EmployeeGrade, string> = {
  intern: 'Стажёр',
  assistant: 'Помощник',
  junior: 'Новичок',
  professional: 'Профессионал',
  expert_mentor: 'Эксперт-наставник',
}

type EmployeeFormState = Record<string, {
  role: EmployeeRole
  grade: EmployeeGrade
}>

const isEmployeeRole = (value: string | null): value is EmployeeRole =>
  EMPLOYEE_ROLES.includes(value as EmployeeRole)

const isEmployeeGrade = (value: string | null): value is EmployeeGrade =>
  EMPLOYEE_GRADES.includes(value as EmployeeGrade)

const formatDate = (value: string | null) => {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const getEmployeeName = (employee: Employee) =>
  employee.full_name?.trim() || employee.email || 'Сотрудник'

const getInitialFormState = (employees: Employee[]): EmployeeFormState =>
  Object.fromEntries(
    employees.map((employee) => [
      employee.id,
      {
        role: isEmployeeRole(employee.role) ? employee.role : 'waiter',
        grade: isEmployeeGrade(employee.grade) ? employee.grade : 'junior',
      },
    ])
  )

const selectClassName =
  'h-10 w-full rounded-xl border border-input/80 bg-background/70 px-3 text-xs shadow-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-60'

export const AdminEmployeesPage = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formState, setFormState] = useState<EmployeeFormState>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getEmployees()
        setEmployees(data)
        setFormState(getInitialFormState(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки сотрудников')
      } finally {
        setLoading(false)
      }
    }

    void fetchEmployees()
  }, [])

  const changedEmployees = useMemo(
    () =>
      new Set(
        employees
          .filter((employee) => {
            const current = formState[employee.id]

            if (!current) {
              return false
            }

            const role = isEmployeeRole(employee.role) ? employee.role : 'waiter'
            const grade = isEmployeeGrade(employee.grade) ? employee.grade : 'junior'

            return current.role !== role || current.grade !== grade
          })
          .map((employee) => employee.id)
      ),
    [employees, formState]
  )

  const handleChange = (
    employeeId: string,
    field: 'role' | 'grade',
    value: EmployeeRole | EmployeeGrade
  ) => {
    setMessage(null)
    setError(null)
    setFormState((current) => {
      const employeeState = current[employeeId] ?? {
        role: 'waiter',
        grade: 'junior',
      }

      return {
        ...current,
        [employeeId]:
          field === 'role'
            ? { ...employeeState, role: value as EmployeeRole }
            : { ...employeeState, grade: value as EmployeeGrade },
      }
    })
  }

  const handleSave = async (employee: Employee) => {
    const current = formState[employee.id]

    if (!current) {
      return
    }

    if (employee.id === user?.id && current.role !== 'admin') {
      setError('Нельзя снять с себя роль администратора')
      return
    }

    try {
      setSavingId(employee.id)
      setError(null)
      setMessage(null)

      const updatedEmployee = await updateEmployee(employee.id, current)

      setEmployees((currentEmployees) =>
        currentEmployees.map((nextEmployee) =>
          nextEmployee.id === updatedEmployee.id ? updatedEmployee : nextEmployee
        )
      )
      setFormState((currentState) => ({
        ...currentState,
        [updatedEmployee.id]: {
          role: isEmployeeRole(updatedEmployee.role) ? updatedEmployee.role : 'waiter',
          grade: isEmployeeGrade(updatedEmployee.grade) ? updatedEmployee.grade : 'junior',
        },
      }))
      setMessage('Изменения сохранены')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить сотрудника')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return <AppLoader />
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Сотрудники
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Роли и грейды команды
          </p>
        </div>
        <div className="w-fit rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Всего: <span className="font-semibold text-foreground">{employees.length}</span>
        </div>
      </header>

      {(message || error) && (
        <div
          className={
            error
              ? 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'
              : 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
          }
        >
          {error || message}
        </div>
      )}

      {employees.length === 0 ? (
        <Card className="bg-white/80">
          <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
            Сотрудники не найдены
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden bg-white/85 shadow-md backdrop-blur md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-5">Сотрудник</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Грейд</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead className="pr-5 text-right">Действие</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const state = formState[employee.id]
                      const isCurrentUser = employee.id === user?.id
                      const canSave = changedEmployees.has(employee.id)

                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="px-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                                {employee.avatar_url ? (
                                  <img
                                    src={employee.avatar_url}
                                    alt={getEmployeeName(employee)}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Avatar
                                    name={getEmployeeName(employee)}
                                    variant="beam"
                                    colors={avatarColors}
                                    size={44}
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold">
                                    {getEmployeeName(employee)}
                                  </span>
                                  {isCurrentUser && <Badge variant="secondary">Вы</Badge>}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {employee.email || 'Почта не указана'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <select
                              value={state?.role ?? 'waiter'}
                              disabled={isCurrentUser}
                              className={selectClassName}
                              onChange={(event) =>
                                handleChange(employee.id, 'role', event.target.value as EmployeeRole)
                              }
                            >
                              {EMPLOYEE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {roleLabels[role]}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              value={state?.grade ?? 'junior'}
                              className={selectClassName}
                              onChange={(event) =>
                                handleChange(employee.id, 'grade', event.target.value as EmployeeGrade)
                              }
                            >
                              {EMPLOYEE_GRADES.map((grade) => (
                                <option key={grade} value={grade}>
                                  {gradeLabels[grade]}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(employee.created_at)}
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <Button
                              type="button"
                              className="h-10 rounded-xl"
                              disabled={!canSave || savingId === employee.id}
                              onClick={() => handleSave(employee)}
                            >
                              {savingId === employee.id ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
          </Card>

          <div className="grid gap-3 md:hidden">
              {employees.map((employee) => {
                const state = formState[employee.id]
                const isCurrentUser = employee.id === user?.id
                const canSave = changedEmployees.has(employee.id)

                return (
                  <Card key={employee.id} className="bg-white/85 shadow-sm backdrop-blur">
                    <CardContent className="grid gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                          {employee.avatar_url ? (
                            <img
                              src={employee.avatar_url}
                              alt={getEmployeeName(employee)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Avatar
                              name={getEmployeeName(employee)}
                              variant="beam"
                              colors={avatarColors}
                              size={48}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {getEmployeeName(employee)}
                            </span>
                            {isCurrentUser && <Badge variant="secondary">Вы</Badge>}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {employee.email || 'Почта не указана'}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Роль
                          <select
                            value={state?.role ?? 'waiter'}
                            disabled={isCurrentUser}
                            className={selectClassName}
                            onChange={(event) =>
                              handleChange(employee.id, 'role', event.target.value as EmployeeRole)
                            }
                          >
                            {EMPLOYEE_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Грейд
                          <select
                            value={state?.grade ?? 'junior'}
                            className={selectClassName}
                            onChange={(event) =>
                              handleChange(employee.id, 'grade', event.target.value as EmployeeGrade)
                            }
                          >
                            {EMPLOYEE_GRADES.map((grade) => (
                              <option key={grade} value={grade}>
                                {gradeLabels[grade]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(employee.created_at)}
                        </span>
                        <Button
                          type="button"
                          className="h-10 min-w-28 rounded-xl"
                          disabled={!canSave || savingId === employee.id}
                          onClick={() => handleSave(employee)}
                        >
                          {savingId === employee.id ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}
