function validateArgs(args) {
  if (args.length < 4) {
    console.error("Usage: node src/index.js <RETRANS:ON|RETRANS:OFF> <START:Y|START:N> <DISPLAY:ON|DISPLAY:OFF> <USER_INITIALS>");
    console.error("Example: node src/index.js RETRANS:ON START:Y DISPLAY:OFF JP,MP");
    process.exit(1);
  }

  const retrans = args[0];
  const startMode = args[1];
  const display = args[2];
  const usersStr = args[3];

  if (retrans !== 'RETRANS:ON' && retrans !== 'RETRANS:OFF') {
    console.error("Error: Parameter 1 must be 'RETRANS:ON' or 'RETRANS:OFF'");
    process.exit(1);
  }

  if (startMode !== 'START:Y' && startMode !== 'START:N') {
    console.error("Error: Parameter 2 must be 'START:Y' or 'START:N'");
    process.exit(1);
  }

  if (display !== 'DISPLAY:ON' && display !== 'DISPLAY:OFF') {
    console.error("Error: Parameter 3 must be 'DISPLAY:ON' or 'DISPLAY:OFF'");
    process.exit(1);
  }

  if (!usersStr || usersStr.trim() === '') {
    console.error("Error: Parameter 4 must be a comma-separated list of user initials");
    process.exit(1);
  }

  const users = usersStr.split(',').map(u => u.trim()).filter(u => u.length > 0);

  if (users.length === 0) {
      console.error("Error: Parameter 4 must be a comma-separated list of user initials");
      process.exit(1);
  }

  return {
    retransmissionEnable: retrans === 'RETRANS:ON',
    startFresh: startMode === 'START:Y',
    displayLog: display === 'DISPLAY:ON',
    users,
    usersStr: users.join('_')
  };
}

module.exports = validateArgs;
