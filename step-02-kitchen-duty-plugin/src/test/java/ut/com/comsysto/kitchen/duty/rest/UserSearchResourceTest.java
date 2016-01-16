package ut.com.comsysto.kitchen.duty.rest;

import org.junit.Test;
import org.junit.After;
import org.junit.Before;
import org.mockito.Mockito;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import com.comsysto.kitchen.duty.rest.UserSearchResource;
import com.comsysto.kitchen.duty.rest.UserSearchResourceModel;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.GenericEntity;

public class UserSearchResourceTest {

    @Before
    public void setup() {

    }

    @After
    public void tearDown() {

    }

    @Test
    public void messageIsValid() {
        UserSearchResource resource = new UserSearchResource();

        Response response = resource.getMessage();
        final UserSearchResourceModel message = (UserSearchResourceModel) response.getEntity();

        assertEquals("wrong message","Hello World",message.getMessage());
    }
}
