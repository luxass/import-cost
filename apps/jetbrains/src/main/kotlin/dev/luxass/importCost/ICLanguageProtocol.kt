package dev.luxass.importCost

import com.intellij.lang.javascript.service.JSLanguageService
import com.intellij.lang.javascript.service.JSLanguageServiceUtil
import com.intellij.lang.javascript.service.protocol.JSLanguageServiceInitialState
import com.intellij.lang.javascript.service.protocol.JSLanguageServiceNodeStdProtocolBase
import com.intellij.lang.javascript.service.protocol.LocalFilePath
import com.intellij.openapi.project.Project
import com.intellij.util.Consumer

class ICLanguageProtocol(project: Project, readyConsumer: Consumer<*>) : JSLanguageServiceNodeStdProtocolBase(project, readyConsumer) {
    override fun dispose() {

    }

    override fun createState(): JSLanguageServiceInitialState {
        val result = JSLanguageServiceInitialState()
        result.pluginName = "import-cost"
        val file = JSLanguageServiceUtil.getPluginDirectory(this.javaClass, "lib/index.js")
        println("file: $file")
        result.pluginPath = LocalFilePath.create(file.absolutePath)
        return result
    }

}