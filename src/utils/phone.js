function phoneDesensitize(phone) {
  if (!phone) return ''
  phone = String(phone).replace(/\s-/g, '')
  
  // 11位手机号
  if (/^1\d{10}$/.test(phone)) {
    return phone.slice(0,3) + '****' + phone.slice(7)
  }
  // 普通座机
  if (phone.length >= 7) {
    return phone.slice(0,2) + '****' + phone.slice(-2)
  }
  return phone
}

module.exports = phoneDesensitize