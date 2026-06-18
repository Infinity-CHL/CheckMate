import { supabase } from '@/shared/api/supabase'

export const EMPLOYEE_ROLES = ['admin', 'manager', 'waiter'] as const
export const EMPLOYEE_GRADES = [
  'intern',
  'assistant',
  'junior',
  'professional',
  'expert_mentor',
] as const

export type EmployeeRole = typeof EMPLOYEE_ROLES[number]
export type EmployeeGrade = typeof EMPLOYEE_GRADES[number]

export type Employee = {
  id: string
  email: string | null
  role: EmployeeRole | string | null
  full_name: string | null
  grade: EmployeeGrade | string | null
  avatar_url: string | null
  created_at: string | null
}

export type UpdateEmployeeData = {
  role: EmployeeRole
  grade: EmployeeGrade
}

export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, full_name, grade, avatar_url, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

export const updateEmployee = async (
  employeeId: string,
  data: UpdateEmployeeData
): Promise<Employee> => {
  const { data: employee, error } = await supabase
    .from('users')
    .update({
      role: data.role,
      grade: data.grade,
    })
    .eq('id', employeeId)
    .select('id, email, role, full_name, grade, avatar_url, created_at')
    .single()

  if (error) throw error

  return employee
}
