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
import { setUserActiveStatus } from '@services/user.active.service.js';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';

const Alumnos = () => {
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

  const handleToggleActive = async (user) => {
    const action = user.activo ? 'desactivar' : 'reactivar';
    const confirm = await window.Swal.fire({
      title: `¿Seguro que quieres ${action} la cuenta?`,
      text: user.activo ? 'El usuario no podrá iniciar sesión.' : 'El usuario podrá volver a iniciar sesión.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: user.activo ? '#d33' : '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: user.activo ? 'Desactivar' : 'Reactivar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      const res = await setUserActiveStatus(user.rut, !user.activo);
      if (res && !res.error) {
        showSuccessAlert('¡Listo!', user.activo ? 'Cuenta desactivada.' : 'Cuenta reactivada.');
        await fetchUsers();
      } else {
        showErrorAlert('Error', res?.error || 'No se pudo cambiar el estado.');
      }
    }
  };

  const columnsAlumnos = useMemo(() => [
    { title: "Nombre", field: "nombreCompleto", width: 180, responsive: 0, headerSort: true, resizable: true },
    { title: "Correo", field: "email", width: 180, responsive: 3, headerSort: true, resizable: true },
    { title: "Rut", field: "rut", width: 100, responsive: 2, headerSort: true, resizable: true },
    { title: "Carrera", field: "carrera", width: 120, responsive: 2, headerSort: true, resizable: true },
    { title: "Año de ingreso", field: "anioIngreso", width: 90, responsive: 2, headerSort: true, resizable: true },
    { title: "Año de egreso", field: "anioEgreso", width: 90, responsive: 2, headerSort: true, resizable: true },
    { title: "Estado", field: "activo", width: 80, responsive: 2, headerSort: true, resizable: true,
      formatter: (cell) => cell.getValue()
        ? `<span style='color:green;font-weight:bold;'>Activo</span>`
        : `<span style='color:#E4332C;font-weight:bold;'>Inactivo</span>`
    },
    { title: "Rol", field: "rol", width: 90, responsive: 2, headerSort: true, resizable: true },
    { title: "Creado", field: "createdAt", width: 120, responsive: 2, headerSort: true, resizable: true }
  ], []);

  const alumnos = useMemo(() => (
    users.filter(u => {
      const rol = u.rol ? u.rol.toLowerCase().trim() : '';
      return rol === 'estudiante' && u.email.endsWith('@alumnos.ubiobio.cl');
    })
  ), [users]);

  const alumnosSorted = useMemo(() => {
    return [...alumnos].sort((a, b) => {
      if (a.nombreCompleto < b.nombreCompleto) return -1;
      if (a.nombreCompleto > b.nombreCompleto) return 1;
      if (a.carrera < b.carrera) return -1;
      if (a.carrera > b.carrera) return 1;
      return 0;
    });
  }, [alumnos]);

  return (
    <div className='users-container'>
      <div className='table-container'>
        <div className='top-table'>
          <h1 className='title-table'>Alumnos Registrados</h1>
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
          data={alumnosSorted}
          columns={columnsAlumnos}
          filter={filterRut}
          dataToFilter={'rut'}
          initialSortName={'nombreCompleto'}
          onSelectionChange={handleSelectionChange}
          selectableRows={true}
          selectedRows={dataUser.filter(u => alumnosSorted.some(a => a.rut === u.rut))}
        />
      </div>

      <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
    </div>
  );
};

export default Alumnos;
