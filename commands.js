const COMMANDS = [
  {
    command: "show_month",
    description: "Статистика за месяц",
  },
  {
    command: "show_year",
    description: "Статистика за год",
  },
  {
    command: "restart_poll",
    description: "Запустить заново опрос для мема (надо ввести id)",
  },
  {
    command: "reset_reports",
    description: "Сбросить статистику (только для теста, потом удалить, иначе каждый умник будет затирать бд)",
  }
];

module.exports = COMMANDS;