
import React, { useState, useEffect } from 'react';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { db } from '../db';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { hashPassword } from '../utils/security';

export const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { addToast } = useAlert();
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [password, setPassword] = useState('');

    const fetchUsers = async () => {
        const allUsers = await db.rawDb.users.toArray();
        setUsers(allUsers);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSave = async () => {
        if (!editingUser?.username || !editingUser?.name || !editingUser?.role) {
            addToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            if (editingUser.id) {
                // Edit
                const updateData: any = { ...editingUser };
                if (password) {
                     updateData.password = await hashPassword(password);
                }

                await db.rawDb.users.update(editingUser.id, updateData);
                addToast('Usuário atualizado', 'success');
            } else {
                // Create
                if (!password) {
                     addToast('Senha é obrigatória para novos usuários', 'error');
                     return;
                }

                // Case-insensitive check
                const exists = await db.rawDb.users
                    .where('username')
                    .equalsIgnoreCase(editingUser.username)
                    .count();

                if (exists > 0) {
                    addToast('Nome de usuário já existe', 'error');
                    return;
                }

                const hashedPassword = await hashPassword(password);

                await db.rawDb.users.add({
                    id: crypto.randomUUID(),
                    username: editingUser.username,
                    name: editingUser.name,
                    role: editingUser.role as UserRole,
                    active: true,
                    password: hashedPassword,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${editingUser.username}`
                });
                addToast('Usuário criado', 'success');
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setPassword('');
            fetchUsers();
        } catch (e) {
            addToast('Erro ao salvar usuário', 'error');
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            addToast('Você não pode excluir a si mesmo', 'error');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            await db.rawDb.users.delete(id);
            addToast('Usuário excluído', 'success');
            fetchUsers();
        }
    };

    return (
        <PageContainer scrollable>
            <PageHeader
                title="Gestão de Usuários"
                description="Controle de acesso e permissões do sistema."
            >
                <Button onClick={() => { setEditingUser({}); setPassword(''); setIsModalOpen(true); }} icon="person_add">
                    Novo Usuário
                </Button>
            </PageHeader>

            <Card padding="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img src={u.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-100" />
                                        <div>
                                            <div className="font-bold">{u.name}</div>
                                            <div className="text-xs text-text-secondary">@{u.username}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={u.role === 'ADMIN' ? 'primary' : u.role === 'OPERATOR' ? 'info' : 'neutral'}>
                                        {u.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={u.active ? 'success' : 'danger'}>
                                        {u.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" icon="edit" onClick={() => { setEditingUser(u); setPassword(''); setIsModalOpen(true); }} />
                                        {u.id !== currentUser?.id && (
                                            <Button size="sm" variant="ghost" icon="delete" className="text-danger" onClick={() => handleDelete(u.id)} />
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal Simplificado (Inline implementation for speed) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-md border border-border-light dark:border-border-dark animate-fade-in-up">
                        <div className="p-6 border-b border-border-light dark:border-border-dark">
                            <h3 className="font-bold text-lg">{editingUser?.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Nome Completo</label>
                                <input
                                    className="w-full p-2 rounded bg-background-light dark:bg-slate-800 border border-border-light dark:border-border-dark"
                                    value={editingUser?.name || ''}
                                    onChange={e => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Username</label>
                                <input
                                    className="w-full p-2 rounded bg-background-light dark:bg-slate-800 border border-border-light dark:border-border-dark"
                                    value={editingUser?.username || ''}
                                    onChange={e => setEditingUser(prev => ({ ...prev, username: e.target.value }))}
                                    disabled={!!editingUser?.id}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                                    {editingUser?.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                                </label>
                                <input
                                    type="password"
                                    className="w-full p-2 rounded bg-background-light dark:bg-slate-800 border border-border-light dark:border-border-dark"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Função</label>
                                <select
                                    className="w-full p-2 rounded bg-background-light dark:bg-slate-800 border border-border-light dark:border-border-dark"
                                    value={editingUser?.role || 'OPERATOR'}
                                    onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
                                >
                                    <option value="ADMIN">Administrador</option>
                                    <option value="OPERATOR">Operador</option>
                                    <option value="VIEWER">Visualizador</option>
                                </select>
                            </div>
                            {editingUser?.id && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="activeCheck"
                                        checked={editingUser?.active ?? true}
                                        onChange={e => setEditingUser(prev => ({ ...prev, active: e.target.checked }))}
                                    />
                                    <label htmlFor="activeCheck">Usuário Ativo</label>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-background-light dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSave}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};
