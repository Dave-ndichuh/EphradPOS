'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    FIRST_NAME: '', LAST_NAME: '', GENDER: 'Male', EMAIL: '', PHONE_NUMBER: '', JOB_TITLE: '', LOCATION_CITY: '', PIN: ''
  });

  const fetchEmployees = async () => {
    try {
      const { getEmployees } = await import('@/actions/employees');
      const data = await getEmployees();
      setEmployees(data.employees);
      setJobs(data.jobs);
      setLocations(data.locations);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = (employee = null) => {
    if (employee) {
      setEditingId(employee.EMPLOYEE_ID);
      setFormData({
        FIRST_NAME: employee.FIRST_NAME || '',
        LAST_NAME: employee.LAST_NAME || '',
        GENDER: employee.GENDER || 'Male',
        EMAIL: employee.EMAIL || '',
        PHONE_NUMBER: employee.PHONE_NUMBER || '',
        JOB_TITLE: employee.job?.JOB_TITLE || '',
        LOCATION_CITY: employee.location?.CITY || '',
        PIN: employee.PIN || ''
      });
    } else {
      setEditingId(null);
      setFormData({ FIRST_NAME: '', LAST_NAME: '', GENDER: 'Male', EMAIL: '', PHONE_NUMBER: '', JOB_TITLE: '', LOCATION_CITY: '', PIN: '' });
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const saveEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { saveEmployee: saveEmployeeAction } = await import('@/actions/employees');
      const result = await saveEmployeeAction(editingId, formData);
      
      if (!result.success) {
        setErrorMsg(result.error);
      } else {
        setShowModal(false);
        fetchEmployees();
      }
    } catch (error) {
      setErrorMsg(error.message);
    }
    
    setLoading(false);
  };

  const deleteEmployee = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setLoading(true);
      try {
        const { deleteEmployee: deleteEmployeeAction } = await import('@/actions/employees');
        const result = await deleteEmployeeAction(id);
        
        if (!result.success) {
          alert(`Delete Error: ${result.error}`);
        }
      } catch (err) {
        alert(`Delete Error: ${err.message}`);
      }
      fetchEmployees();
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.FIRST_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.LAST_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.EMAIL?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <div className="glass table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name / Username</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Location</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading employees...</td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.EMPLOYEE_ID}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{emp.FIRST_NAME} {emp.LAST_NAME}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>@{emp.USERNAME || 'pending'}</div>
                  </td>
                  <td className="text-muted">{emp.GENDER}</td>
                  <td>{emp.EMAIL}</td>
                  <td className="text-muted">{emp.PHONE_NUMBER}</td>
                  <td><span className="badge badge-warning">{emp.job?.JOB_TITLE || 'N/A'}</span></td>
                  <td className="text-muted">{emp.location?.CITY || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit" onClick={() => openModal(emp)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => deleteEmployee(emp.EMPLOYEE_ID)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={saveEmployee} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {errorMsg && (
                <div style={{ padding: '1rem', background: 'rgba(217, 4, 41, 0.1)', border: '1px solid rgba(217, 4, 41, 0.2)', borderRadius: '8px', color: '#D90429', fontSize: '0.875rem', fontWeight: 500, userSelect: 'text' }}>
                  {errorMsg}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="text" className="input" placeholder="First Name" value={formData.FIRST_NAME} onChange={e => setFormData({...formData, FIRST_NAME: e.target.value})} required />
                  <input type="text" className="input" placeholder="Last Name" value={formData.LAST_NAME} onChange={e => setFormData({...formData, LAST_NAME: e.target.value})} required />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="email" className="input" placeholder="Email Address" value={formData.EMAIL} onChange={e => setFormData({...formData, EMAIL: e.target.value})} required disabled={!!editingId} title={editingId ? "Cannot change email after creation" : ""} />
                  <input type="tel" className="input" placeholder="Phone Number" value={formData.PHONE_NUMBER} onChange={e => setFormData({...formData, PHONE_NUMBER: e.target.value})} required />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select className="input" value={formData.GENDER} onChange={e => setFormData({...formData, GENDER: e.target.value})} style={{ background: 'var(--card)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  
                  <input type="text" className="input" placeholder="Job Role (e.g. Manager)" value={formData.JOB_TITLE} onChange={e => setFormData({...formData, JOB_TITLE: e.target.value})} required />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="text" className="input" placeholder="City Location" value={formData.LOCATION_CITY} onChange={e => setFormData({...formData, LOCATION_CITY: e.target.value})} required />
                  <input type="text" className="input" placeholder={editingId ? "PIN cannot be edited here" : "Set 4-Digit PIN"} maxLength="4" value={formData.PIN} onChange={e => setFormData({...formData, PIN: e.target.value.replace(/\D/g, '')})} required={!editingId} disabled={!!editingId} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
