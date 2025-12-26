import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TouchTargetButton } from '../components/TouchTargetButton';
import { RoleBadge } from '../components/RoleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { QuestionInputField } from '../components/QuestionInputField';
import { validators } from '../utils/validators';
import { apiClient } from '../utils/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: { name: string; email: string; password: string; role: string }) => void;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (userId: string, userData: { name: string; email: string; role: string }) => void;
}

function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({ name, email, password, role });
    setName('');
    setEmail('');
    setPassword('');
    setRole('sales');
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create User</h2>
        <QuestionInputField
          label="Name"
          type="text"
          value={name}
          onChange={setName}
          required
        />
        <QuestionInputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <QuestionInputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
        />
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="sales">Sales</option>
            <option value="scheduler">Scheduler</option>
            <option value="production">Production</option>
            <option value="installer">Installer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <TouchTargetButton variant="primary" onClick={handleSubmit}>
          Create User
        </TouchTargetButton>
        <TouchTargetButton variant="secondary" onClick={onClose}>
          Cancel
        </TouchTargetButton>
      </div>
    </div>
  );
}

function EditUserModal({ isOpen, user, onClose, onSubmit }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = () => {
    onSubmit(user.id, { name, email, role });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit User</h2>
        <QuestionInputField
          label="Name"
          type="text"
          value={name}
          onChange={setName}
          required
        />
        <QuestionInputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="sales">Sales</option>
            <option value="scheduler">Scheduler</option>
            <option value="production">Production</option>
            <option value="installer">Installer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <TouchTargetButton variant="primary" onClick={handleSubmit}>
          Update User
        </TouchTargetButton>
        <TouchTargetButton variant="secondary" onClick={onClose}>
          Cancel
        </TouchTargetButton>
      </div>
    </div>
  );
}

export function UserManagement(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        } else {
          setError('Failed to load users. Please try again.');
        }
      } catch (err: any) {
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateUser = async (userData: { name: string; email: string; password: string; role: string }): Promise<void> => {
    if (!userData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!validators.validateEmail(userData.email)) {
      setError('Invalid email format');
      return;
    }
    if (userData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    const validRoles = ['sales', 'scheduler', 'production', 'installer', 'admin'];
    if (!validRoles.includes(userData.role)) {
      setError('Invalid role');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.status === 201) {
        const newUser = await response.json();
        setUsers([...users, newUser]);
        setShowCreateModal(false);
        showMessage('User created successfully');
      } else if (response.status === 409) {
        setError('Email already exists');
      } else {
        setError(`Failed to create user: ${response.status}`);
      }
    } catch (err: any) {
      setError(`Failed to create user: ${err.message}`);
    }
  };

  const handleEditUser = async (userId: string, userData: { name: string; email: string; role: string }): Promise<void> => {
    if (!userData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!validators.validateEmail(userData.email)) {
      setError('Invalid email format');
      return;
    }
    const validRoles = ['sales', 'scheduler', 'production', 'installer', 'admin'];
    if (!validRoles.includes(userData.role)) {
      setError('Invalid role');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.status === 200) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        setShowEditModal(false);
        showMessage('User updated successfully');
      } else if (response.status === 404) {
        setError('User not found');
      } else if (response.status === 409) {
        setError('Email already exists');
      } else {
        setError(`Failed to update user: ${response.status}`);
      }
    } catch (err: any) {
      setError(`Failed to update user: ${err.message}`);
    }
  };

  const handleDeactivateUser = async (userId: string): Promise<void> => {
    const confirmed = window.confirm('Are you sure you want to deactivate this user?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'PUT'
      });

      if (response.status === 200) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
        showMessage('User deactivated successfully');
      } else if (response.status === 404) {
        setError('User not found');
      } else {
        setError(`Failed to deactivate user: ${response.status}`);
      }
    } catch (err: any) {
      setError(`Failed to deactivate user: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <div className="header">
        <h1>User Management</h1>
        <TouchTargetButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create User
        </TouchTargetButton>
      </div>

      {error && (
        <div className="error">
          {error}
          <TouchTargetButton
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Retry
          </TouchTargetButton>
        </div>
      )}

      {message && <div className="success">{message}</div>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td><RoleBadge role={user.role} /></td>
              <td><StatusBadge status={user.is_active ? 'active' : 'inactive'} /></td>
              <td>
                <TouchTargetButton
                  variant="secondary"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </TouchTargetButton>
                <TouchTargetButton
                  variant="danger"
                  onClick={() => handleDeactivateUser(user.id)}
                >
                  Deactivate
                </TouchTargetButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditUser}
      />
    </div>
  );
}