package pe.albrugroup.auth_service.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.auth_service.usecase.IUsuario;

@RestController @Slf4j
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final IUsuario usuarioService;


}
