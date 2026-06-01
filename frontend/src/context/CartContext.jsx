import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { getMyPreferences, updateMyPreferences as persistMyPreferences } from '../services/userPreferencesApi'

const CartContext = createContext()

const getScope = (user) => user?.id || user?._id || user?.email || 'guest'
const getStorageKey = (baseKey, user) => `${baseKey}_${getScope(user)}`

const readScopedValue = (baseKey, user) => {
  try {
    const saved = localStorage.getItem(getStorageKey(baseKey, user))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])

const normalizeProductRef = (product) => {
  if (!product) return null
  const slug = String(product.slug || product.id || product._id || '').trim()
  const id = String(product.id || product.slug || product._id || '').trim()
  return {
    ...product,
    id,
    slug,
    _id: product._id || (product.id && /^[0-9a-fA-F]{24}$/.test(String(product.id)) ? product.id : ''),
    title: product.title || product.name || '',
    name: product.name || product.title || '',
    sku: product.sku || '',
    category: product.category || '',
    qty: Math.max(1, Number(product.qty || 1)),
  }
}

const mergeUniqueById = (...groups) => {
  const map = new Map()
  groups.flat().filter(Boolean).forEach((item) => {
    const normalized = normalizeProductRef(item)
    if (!normalized) return
    const key = normalized.slug || normalized.id || normalized._id
    if (!key) return
    map.set(key, normalized)
  })
  return Array.from(map.values())
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [compare, setCompare] = useState([])
  const [preferencesReady, setPreferencesReady] = useState(false)
  const skipPersistRef = useRef(true)
  const syncTimerRef = useRef(null)

  const storageKeys = useMemo(() => ({
    cart: getStorageKey('TOYOVOINDIA_cart', user),
    wishlist: getStorageKey('TOYOVOINDIA_wishlist', user),
    compare: getStorageKey('TOYOVOINDIA_compare', user),
  }), [user])

  useEffect(() => {
    let isMounted = true
    skipPersistRef.current = true
    setPreferencesReady(false)

    const loadPreferences = async () => {
      const localCart = normalizeArray(readScopedValue('TOYOVOINDIA_cart', user))
      const localWishlist = normalizeArray(readScopedValue('TOYOVOINDIA_wishlist', user))
      const localCompare = normalizeArray(readScopedValue('TOYOVOINDIA_compare', user))

      const guestCart = user ? normalizeArray(readScopedValue('TOYOVOINDIA_cart', null)) : []
      const guestWishlist = user ? normalizeArray(readScopedValue('TOYOVOINDIA_wishlist', null)) : []
      const guestCompare = user ? normalizeArray(readScopedValue('TOYOVOINDIA_compare', null)) : []

      if (!user) {
        if (!isMounted) return
        setCartItems(localCart.map(normalizeProductRef).filter(Boolean))
        setWishlist(localWishlist.map(normalizeProductRef).filter(Boolean))
        setCompare(localCompare.map(normalizeProductRef).filter(Boolean))
        setPreferencesReady(true)
        queueMicrotask(() => {
          skipPersistRef.current = false
        })
        return
      }

      try {
        const server = await getMyPreferences()
        if (!isMounted) return

        const mergedCart = mergeUniqueById(server.cart, guestCart).map((item) => {
          const guestItem = guestCart.find((candidate) => (candidate.slug || candidate.id) === (item.slug || item.id))
          
          let maxQty = Number(item.qty || 1)
          if (guestItem) maxQty = Math.max(maxQty, Number(guestItem.qty || 1))

          return { ...item, qty: maxQty }
        })

        setCartItems(mergedCart)
        setWishlist(mergeUniqueById(server.wishlist, guestWishlist))
        setCompare(mergeUniqueById(server.compare, guestCompare))

        if (guestCart.length > 0 || guestWishlist.length > 0 || guestCompare.length > 0) {
          localStorage.removeItem('TOYOVOINDIA_cart_guest')
          localStorage.removeItem('TOYOVOINDIA_wishlist_guest')
          localStorage.removeItem('TOYOVOINDIA_compare_guest')
        }
      } catch {
        if (!isMounted) return
        setCartItems(mergeUniqueById(localCart, guestCart).map(normalizeProductRef).filter(Boolean))
        setWishlist(mergeUniqueById(localWishlist, guestWishlist).map(normalizeProductRef).filter(Boolean))
        setCompare(mergeUniqueById(localCompare, guestCompare).map(normalizeProductRef).filter(Boolean))
      } finally {
        if (isMounted) {
          setPreferencesReady(true)
          queueMicrotask(() => {
            skipPersistRef.current = false
          })
        }
      }
    }

    loadPreferences()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?._id, user?.email])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem(storageKeys.cart, JSON.stringify(cartItems))
  }, [cartItems, storageKeys.cart, preferencesReady])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem(storageKeys.wishlist, JSON.stringify(wishlist))
  }, [wishlist, storageKeys.wishlist, preferencesReady])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem(storageKeys.compare, JSON.stringify(compare))
  }, [compare, storageKeys.compare, preferencesReady])

  useEffect(() => {
    if (!user || !preferencesReady || skipPersistRef.current) return

    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      persistMyPreferences({
        cart: cartItems,
        wishlist,
        compare,
      }).catch(() => {})
    }, 250)

    return () => {
      clearTimeout(syncTimerRef.current)
    }
  }, [user, cartItems, wishlist, compare, preferencesReady])

  const addToCart = (product, quantity = 1) => {
    const normalizedProduct = normalizeProductRef(product)
    if (!normalizedProduct) return

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === normalizedProduct.id)
      if (existing) {
        return prev.map((item) => (
          item.id === normalizedProduct.id
            ? { ...item, qty: item.qty + quantity }
            : item
        ))
      }
      return [...prev, { ...normalizedProduct, qty: Math.max(1, Number(quantity || 1)) }]
    })
  }

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            if (nextQty < 1) {
              return null;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => setCartItems([])

  const toggleWishlist = (product) => {
    const normalizedProduct = normalizeProductRef(product)
    if (!normalizedProduct) return

    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === normalizedProduct.id)
      if (exists) {
        return prev.filter((item) => item.id !== normalizedProduct.id)
      }
      return [...prev, normalizedProduct]
    })
  }

  const { error: showToastError } = useToast()
  
  const toggleCompare = (product) => {
    const normalizedProduct = normalizeProductRef(product)
    if (!normalizedProduct) return

    setCompare((prev) => {
      const exists = prev.find((item) => item.id === normalizedProduct.id)
      if (exists) {
        return prev.filter((item) => item.id !== normalizedProduct.id)
      }
      if (prev.length >= 4) {
        showToastError('Comparison list is full (max 4 products)')
        return prev
      }
      return [...prev, normalizedProduct]
    })
  }

  const clearCompare = () => setCompare([])

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.qty || 0)), 0)
  const cartCount = cartItems.reduce((acc, item) => acc + Number(item.qty || 0), 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      wishlist,
      compare,
      preferencesReady,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleWishlist,
      toggleCompare,
      clearCompare,
      subtotal,
      cartCount,
    }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
