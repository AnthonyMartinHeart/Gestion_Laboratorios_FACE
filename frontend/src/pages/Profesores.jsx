import Table from '@components/Table';
import useUsers from '@hooks/users/useGetUsers.jsx';
import Search from '../components/Search';
import Popup from '../components/Popup';
import DeleteIcon from '../assets/deleteIcon.svg';
import UpdateIcon from '../assets/updateIcon.svg';
import UpdateIconDisable from '../assets/updateIconDisabled.svg';
import DeleteIconDisable from '../assets/deleteIconDisabled.svg';
import { useCallback, useMemo, useState } from 'react';
import '@styles/users.css';
import useEditUser from '@hooks/users/useEditUser';
import useDeleteUser from '@hooks/users/useDeleteUser';

const Profesores = () => {
  const { users, fetchUsers, setUsers } = useUsers();
  const [filterRut, setFilterRut] = useState('');

  const {
    handleClickUpdate,
    handleUpdate,
    isPopupOpen,
    setIsPopupOpen,
    dataUser,
    setDataUser
  } = useEditUser(setUsers, fetchUsers);

  const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

  const handleRutFilterChange = (e) => {
    setFilterRut(e.target.value);
  };

  const handleSelectionChange = useCallback((selectedUsers) => {
    setDataUser(prev => {
      if (
        prev.length === selectedUsers.length &&
        prev.every((u, i) => u.rut === selectedUsers[i]?.rut)
      ) {
        return prev;
      }
      return selectedUsers;
    });
  }, [setDataUser]);

  const columnsProfesores = useMemo(() => [
    { title: "Nombre", field: "nombreCompleto", width: 350, responsive: 0 },
    { title: "Correo electrónico", field: "email", width: 300, responsive: 3 },
    { title: "Rut", field: "rut", width: 150, responsive: 2 },
    { title: "Rol", field: "rol", width: 200, responsive: 2 },
    { title: "Creado", field: "createdAt", width: 200, responsive: 2 }
  ], []);

  const profesores = useMemo(() => (
    users.filter(u => u.rol && u.rol.toLowerCase().trim() === 'profesor')
  ), [users]);

  const profesoresSorted = useMemo(() => {
    return [...profesores].sort((a, b) => {
      if (a.nombreCompleto < b.nombreCompleto) return -1;
      if (a.nombreCompleto > b.nombreCompleto) return 1;
      return 0;
    });
  }, [profesores]);

  return (
    <div className='users-container'>
      <div className='table-container'>
        <div className='top-table'>
          <h1 className='title-table'>Profesores del Sistema</h1>
          <div className='filter-actions'>
            <Search value={filterRut} onChange={handleRutFilterChange} placeholder={'Filtrar por rut'} />
            <button onClick={handleClickUpdate} disabled={dataUser.length === 0}>
              <img src={dataUser.length === 0 ? UpdateIconDisable : UpdateIcon} alt="edit" />
            </button>
            <button className='delete-user-button' disabled={dataUser.length === 0} onClick={() => handleDelete(dataUser)}>
              <img src={dataUser.length === 0 ? DeleteIconDisable : DeleteIcon} alt="delete" />
            </button>
          </div>
        </div>
        <Table
          data={profesoresSorted}
          columns={columnsProfesores}
          filter={filterRut}
          dataToFilter={'rut'}
          initialSortName={'nombreCompleto'}
          onSelectionChange={handleSelectionChange}
          selectableRows={true}
          selectedRows={dataUser.filter(u => profesoresSorted.some(p => p.rut === u.rut))}
        />
      </div>

      <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
    </div>
  );
};

export default Profesores;
