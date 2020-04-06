const _ = {
    PHONE_NUMBER_UNOCCUPIED: 'PHONE_NUMBER_UNOCCUPIED',
    PHONE_CODE_INVALID: 'PHONE_CODE_INVALID',
    
    is: (err, etype) => err.type == etype
}
Object.freeze(_);
module.exports = _;