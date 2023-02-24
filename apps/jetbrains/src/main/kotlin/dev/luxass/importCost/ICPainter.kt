package dev.luxass.importCost

import com.intellij.openapi.editor.EditorLinePainter
import com.intellij.openapi.editor.LineExtensionInfo
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile

class ICPainter : EditorLinePainter() {

    override fun getLineExtensions(
        project: Project,
        file: VirtualFile,
        lineNumber: Int
    ): MutableCollection<LineExtensionInfo> {
        val service = project.getService(ICLanguageService::class.java)
        val sizes = service.getImportSize(file, lineNumber)
        if (sizes.size <= 0) return mutableListOf()
        println("sizes: $sizes")

        return mutableListOf(
        )
    }
}