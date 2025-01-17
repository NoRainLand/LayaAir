
import { Config } from "../../../../Config";
import { LayaGL } from "../../../layagl/LayaGL";
import { CommandUniformMap } from "../../../RenderEngine/CommandUniformMap";
import { WebGLMode } from "../../../RenderEngine/RenderEngine/WebGLEngine/GLEnum/WebGLMode";
import { WebGlConfig } from "../../../RenderEngine/RenderEngine/WebGLEngine/WebGLConfig";
import { WebGLEngine } from "../../../RenderEngine/RenderEngine/WebGLEngine/WebGLEngine";
import { BufferUsage } from "../../../RenderEngine/RenderEnum/BufferTargetType";
import { IRenderEngineFactory } from "../../../RenderEngine/RenderInterface/IRenderEngineFactory";
import { RenderState } from "../../../RenderEngine/RenderShader/RenderState";
import { ShaderData } from "../../../RenderEngine/RenderShader/ShaderData";
import { ShaderInstance } from "../../../RenderEngine/RenderShader/ShaderInstance";
import { RenderStateCommand } from "../../../RenderEngine/RenderStateCommand";
import { UniformBufferObject } from "../../../RenderEngine/UniformBufferObject";
import { ShaderCompileDefineBase, ShaderProcessInfo } from "../../../webgl/utils/ShaderCompileDefineBase";

export class WebGLRenderEngineFactory implements IRenderEngineFactory {

    /**@internal */
    private globalBlockMap: any = {};

    createShaderData(): ShaderData {
        return new ShaderData();
    }  

 
    createShaderInstance(shaderProcessInfo: ShaderProcessInfo, shaderPass: ShaderCompileDefineBase): ShaderInstance {
        return new ShaderInstance(shaderProcessInfo, shaderPass);
    }

    
    createRenderStateComand(): RenderStateCommand {
        return new RenderStateCommand();
    }

    createRenderState(): RenderState {
        return new RenderState();
    }

    createUniformBufferObject(glPointer: number, name: string, bufferUsage: BufferUsage, byteLength: number, isSingle: boolean): UniformBufferObject {
        return new UniformBufferObject(glPointer, name, bufferUsage, byteLength, isSingle);
    }

    createGlobalUniformMap(blockName: string): CommandUniformMap {
        let comMap = this.globalBlockMap[blockName];
        if (!comMap)
            comMap = this.globalBlockMap[blockName] = new CommandUniformMap(blockName);;
        return comMap;
    }

    createEngine(config: any, canvas: any): Promise<void> {
        let engine: WebGLEngine;
        let glConfig: WebGlConfig = { stencil: Config.isStencil, alpha: Config.isAlpha, antialias: Config.isAntialias, premultipliedAlpha: Config.premultipliedAlpha, preserveDrawingBuffer: Config.preserveDrawingBuffer, depth: Config.isDepth, failIfMajorPerformanceCaveat: Config.isfailIfMajorPerformanceCaveat, powerPreference: Config.powerPreference };

        //TODO  other engine
        const webglMode: WebGLMode = Config.useWebGL2 ? WebGLMode.Auto : WebGLMode.WebGL1;
        engine = new WebGLEngine(glConfig, webglMode);
        engine.initRenderEngine(canvas._source);
        var gl: WebGLRenderingContext = engine._context;//TODO 优化
        if (Config.printWebglOrder)
            this._replaceWebglcall(gl);

        if (gl) {
            new LayaGL();
        }
        LayaGL.renderEngine = engine;
        LayaGL.textureContext = engine.getTextureContext();
        LayaGL.renderDrawContext = engine.getDrawContext();
        LayaGL.render2DContext = engine.get2DRenderContext();
        return Promise.resolve();
    }

    /**@private test function*/
    private _replaceWebglcall(gl: any) {
        var tempgl: { [key: string]: any } = {};
        for (const key in gl) {
            if (typeof gl[key] == "function" && key != "getError" && key != "__SPECTOR_Origin_getError" && key != "__proto__") {
                tempgl[key] = gl[key];
                gl[key] = function () {
                    let arr: IArguments[] = [];
                    for (let i = 0; i < arguments.length; i++) {
                        arr.push(arguments[i]);
                    }
                    let result = tempgl[key].apply(gl, arr);

                    //console.log(RenderInfo.loopCount + ":gl." + key + ":" + arr);
                    let err = gl.getError();
                    if (err) {
                        //console.log(err);
                        debugger;
                    }
                    return result;
                }
            }
        }
    }
}
 
