package com.gentleking.mortify

import android.security.keystore.KeyGenParameterSpec
import android.os.Build
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

@CapacitorPlugin(name="MortifyVault")
class MortifyVaultPlugin: Plugin() {
    private val alias="mortify.journal.key"
    private val prefs get()=context.getSharedPreferences("mortify-vault",0)
    private fun keyStore()=KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    @PluginMethod fun available(call:PluginCall) {
        val supported=BiometricManager.from(context).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)==BiometricManager.BIOMETRIC_SUCCESS
        call.resolve(JSObject().put("available",supported))
    }
    private fun authenticate(call:PluginCall,cipher:Cipher,operation:(Cipher)->Unit) {
        activity.runOnUiThread {
            val prompt=BiometricPrompt(activity,ContextCompat.getMainExecutor(context),object:BiometricPrompt.AuthenticationCallback(){
                override fun onAuthenticationSucceeded(result:BiometricPrompt.AuthenticationResult){
                    try { operation(result.cryptoObject?.cipher ?: throw IllegalStateException()) } catch(_:Exception){call.reject("Private key unavailable. Use your PIN.")}
                }
                override fun onAuthenticationError(code:Int,message:CharSequence){call.reject("Unlock cancelled. You may use your PIN.")}
            })
            val info=BiometricPrompt.PromptInfo.Builder().setTitle("Open your Mortify journal").setSubtitle("Use your fingerprint or face").setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG).setNegativeButtonText("Use PIN").build()
            prompt.authenticate(info,BiometricPrompt.CryptoObject(cipher))
        }
    }
    @PluginMethod fun store(call:PluginCall) {
        try {
            val raw=Base64.decode(call.getString("key") ?: throw IllegalArgumentException(),Base64.NO_WRAP)
            require(raw.size==32)
            val biometric=call.getBoolean("biometric",false) ?: false
            val spec=KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setUserAuthenticationRequired(biometric)
            if(biometric){
                if(Build.VERSION.SDK_INT>=30)spec.setUserAuthenticationParameters(0,KeyProperties.AUTH_BIOMETRIC_STRONG)
                else { @Suppress("DEPRECATION") spec.setUserAuthenticationValidityDurationSeconds(-1) }
                spec.setInvalidatedByBiometricEnrollment(true)
            }
            val generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");generator.init(spec.build());val key=generator.generateKey()
            val cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key)
            val commit:(Cipher)->Unit={ unlocked ->
                val encrypted=unlocked.doFinal(raw);raw.fill(0)
                prefs.edit().putString("ciphertext",Base64.encodeToString(encrypted,Base64.NO_WRAP)).putString("iv",Base64.encodeToString(unlocked.iv,Base64.NO_WRAP)).putBoolean("biometric",biometric).apply();call.resolve()
            }
            if(biometric)authenticate(call,cipher,commit) else commit(cipher)
        } catch(_:Exception){call.reject("Could not save the private key securely. Your PIN still works.")}
    }
    @PluginMethod fun read(call:PluginCall) {
        try {
            val key=keyStore().getKey(alias,null) as SecretKey
            val iv=Base64.decode(prefs.getString("iv",null) ?: throw IllegalStateException(),Base64.NO_WRAP)
            val encrypted=Base64.decode(prefs.getString("ciphertext",null) ?: throw IllegalStateException(),Base64.NO_WRAP)
            val cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key,GCMParameterSpec(128,iv))
            val finish:(Cipher)->Unit={unlocked -> val raw=unlocked.doFinal(encrypted);val encoded=Base64.encodeToString(raw,Base64.NO_WRAP);raw.fill(0);call.resolve(JSObject().put("key",encoded))}
            if(prefs.getBoolean("biometric",true))authenticate(call,cipher,finish) else finish(cipher)
        }catch(_:Exception){call.reject("Private key unavailable. Use your PIN.")}
    }
    @PluginMethod fun remove(call:PluginCall){try{keyStore().deleteEntry(alias);prefs.edit().clear().apply();call.resolve()}catch(_:Exception){call.reject("Could not remove the saved key")}}
}
