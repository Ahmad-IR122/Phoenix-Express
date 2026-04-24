import API from '../../../apis/api';

export async function getEmployeeDashboard() {
  const response = await API.get('/employees/dashboard');
  return response.data;
}