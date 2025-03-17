"use client";
import React, { useState, useEffect } from "react";
import styles from "./Calendario.module.css";
import { db, auth } from "../../credenciales";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";


const TimeSlot = ({ time, type, date, onSelect }) => {
  const getTimeSlotClass = () => {
    switch (type) {
      case "morning":
        return styles.morningSlot;
      case "midday":
        return styles.middaySlot;
      case "afternoon":
        return styles.afternoonSlot;
      default:
        return "";
    }
  };

  const handleClick = () => {
    onSelect({ time, date, type });
  };

  return (
    <div 
      className={`${getTimeSlotClass()} ${styles.clickableSlot}`}
      onClick={handleClick}
    >
      {time}
    </div>
  );
};

const DayCell = ({ day, isToday, isCurrentMonth = true, isAdmin, onAddSlot, availableSlots }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddClick = () => {
    if (!isAdmin) return;
    setShowAddMenu(true);
  };

  const getSlotsForDay = () => {
    return Object.values(availableSlots).filter(slot => slot.date === day);
  };

  const daySlots = getSlotsForDay();

  return (
    <div className={`${styles.dayCell} ${isToday && isCurrentMonth ? styles.today : ''}`}>
      <div className={styles.dayNumber}>
        {day}
        {isAdmin && isCurrentMonth && (
          <button 
            className={styles.addSlotButton}
            onClick={handleAddClick}
          >
            +
          </button>
        )}
      </div>
      {showAddMenu && (
        <div className={styles.addSlotMenu}>
          <button onClick={() => {
            onAddSlot(day, "8:00am", "morning");
            setShowAddMenu(false);
          }}>
            Agregar 8:00am
          </button>
          <button onClick={() => {
            onAddSlot(day, "10:00am", "midday");
            setShowAddMenu(false);
          }}>
            Agregar 10:00am
          </button>
          <button onClick={() => {
            onAddSlot(day, "2:00pm", "afternoon");
            setShowAddMenu(false);
          }}>
            Agregar 2:00pm
          </button>
        </div>
      )}
      {daySlots.map((slot) => (
        <TimeSlot
          key={`${slot.date}-${slot.time}`}
          time={slot.time}
          type={slot.type}
          date={slot.date}
          onSelect={() => {/* Manejar selección */}}
        />
      ))}
    </div>
  );
};

const WeekdayHeader = () => {
  const weekdays = [
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
    "DOMINGO",
  ];

  return (
    <>
      {weekdays.map((day) => (
        <div key={day} className={styles.weekdayHeader}>
          {day}
        </div>
      ))}
    </>
  );
};

const CalendarHeader = ({ selectedMonth, selectedYear, onMonthChange }) => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <ol>
          <li>
            <a href="/destinos" className={styles.navLink}>
              Destinos
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/sabasnieves" className={styles.navLink}>
              Sabas Nieves
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Calendario</li>
        </ol>
      </nav>
      <div className={styles.calendarNav}>
        <button onClick={() => onMonthChange(-1)} className={styles.navButton}>
          <span>←</span>
        </button>
        <h1 className={styles.monthTitle}>{months[selectedMonth]}, {selectedYear}</h1>
        <button onClick={() => onMonthChange(1)} className={styles.navButton}>
          <span>→</span>
        </button>
      </div>
    </>
  );
};

const ReservationModal = ({ slot, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ name, email, ...slot });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Realizar Reserva</h2>
        <p>Fecha: {slot.date}</p>
        <p>Hora: {slot.time}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className={styles.modalButtons}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Confirmar Reserva</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Calendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableSlots, setAvailableSlots] = useState({});

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        // Verificar si el email es del administrador
        if (user.email === "mperez@gmail.com") {
          setIsAdmin(true);
        } else {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setIsAdmin(userDoc.exists() && userDoc.data().isAdmin === true);
        }
      }
    };

    const loadAvailableSlots = async () => {
      try {
        const slotsQuery = query(
          collection(db, 'availableSlots'),
          where('year', '==', selectedYear),
          where('month', '==', selectedMonth)
        );
        const slotsSnapshot = await getDocs(slotsQuery);
        const slotsData = {};
        
        slotsSnapshot.forEach(doc => {
          const data = doc.data();
          const key = `${data.date}-${data.time}`;
          slotsData[key] = { ...data, id: doc.id };
        });
        
        setAvailableSlots(slotsData);
      } catch (error) {
        console.error("Error loading slots:", error);
      }
    };

    checkAdminStatus();
    loadAvailableSlots();
  }, [selectedMonth, selectedYear]);

  const handleAddTimeSlot = async (date, time, type) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden agregar horarios');
      return;
    }

    try {
      const slotData = {
        date,
        time,
        type,
        month: selectedMonth,
        year: selectedYear,
        createdAt: new Date(),
        available: true
      };

      await addDoc(collection(db, 'availableSlots'), slotData);
      // Recargar horarios
      const key = `${date}-${time}`;
      setAvailableSlots(prev => ({
        ...prev,
        [key]: slotData
      }));
    } catch (error) {
      console.error('Error adding time slot:', error);
      alert('Error al agregar el horario');
    }
  };

  const handleMonthChange = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Obtener la fecha actual solo para comparar el día de hoy
  const today = new Date();
  const currentDate = today.getDate();
  const isCurrentMonth = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  
  // Usar selectedMonth y selectedYear en lugar de current
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
  const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
  
  // Calcular días del mes anterior
  const firstDayWeekday = firstDayOfMonth.getDay() || 7;
  const prevMonthDays = Array.from({ length: firstDayWeekday - 1 }, (_, i) => {
    const day = new Date(selectedYear, selectedMonth, -i);
    return day.getDate().toString();
  }).reverse();
  
  // Generar días del mes actual
  const currentMonthDays = Array.from(
    { length: lastDayOfMonth.getDate() },
    (_, i) => (i + 1).toString()
  );
  
  // Calcular días del próximo mes
  const remainingDays = 42 - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from(
    { length: remainingDays },
    (_, i) => (i + 1).toString()
  );

  return (
    <>
    <div className={styles.calendarContainer}>
      <div className={styles.calendarWrapper}>
        <CalendarHeader 
          selectedMonth={selectedMonth} 
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
        />
        <div className={styles.calendarGrid}>
          <WeekdayHeader />
          {prevMonthDays.map((day) => (
            <div key={`prev-${day}`} className={styles.inactiveDayCell}>
              {day}
            </div>
          ))}
          {currentMonthDays.map((day) => (
            <DayCell 
              key={`current-${day}`} 
              day={day} 
              isToday={parseInt(day) === currentDate && isCurrentMonth}
              isCurrentMonth={true}
              isAdmin={isAdmin}
              onAddSlot={handleAddTimeSlot}
              availableSlots={availableSlots}
            />
          ))}
          {nextMonthDays.map((day) => (
            <DayCell 
              key={`next-${day}`} 
              day={day}
              isToday={false}
              isCurrentMonth={false}
              isAdmin={isAdmin}
              onAddSlot={handleAddTimeSlot}
              availableSlots={availableSlots}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Calendar;
